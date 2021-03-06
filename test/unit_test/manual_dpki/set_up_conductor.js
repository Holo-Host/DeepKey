const { simple_conductor_config } = require('../../config')

const REVOCATION_KEY = "HcSCIgvyd46Q4d9xa4gesx8j5tE7crna8m9U4Z63yzmf5aob6t3mKTNIp8mp8fi";
const SIGNED_AUTH_KEY_1 ="CPhaw45L6MjxPOsVBFsTYkl35hS4h9yRNqsl1fqfNx5P6z6l6WE6aLSrBjD3Dfe3HSg3vNSHtC1QeN0FWBo+DQ==";
const WRONG_SINGED_AUTH_KEY = "D16Dl3Cywos/AS/ANPqsvkRZCCKWPd1KTkdANOxqG1MXRtdCaTYYAOO13mcYYtfzWbaagwLk5oFlns2uQneUDg==";
const SIGNED_AUTH_KEY_2 ="LbEReAxFLkkzfOHRBixC7+DYKGao6lPBYsUycVg3NHmNx7p8237/9unBwrt/o+9P4IWkKR+QCYeFxqBNRnn+Dg==";
const AGENT_SIG_KEY_1 = "HcSCj3HIbzRbnkg6hcgqcoHAMKdgxsjrivPc649dodOU4d6jGw8uW83Xu9mkiva";
const SIGNED_AGENT_SIG_KEY_1_BY_REV_KEY ="JQKlrv9civTtfD20b8jCpSFgoaowZL7qASjYJpY7LOtYIbT7a5XWLte8jjvX0p54mRdCcNWGW47vUl8q3k1+Dw==";
const AGENT_ENC_KEY_1 = "HcKciaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SIGNED_AGENT_ENC_KEY_1_BY_REV_KEY = "LSUEatYDtH5RLEPq87NfF79p9GXEUKUgLLybJMMxS3CquQp/tUvWhEVdAWBkfgEkCKF8tomG+SO6mnb/E32vAw==";
const AGENT_SIG_KEY_2 = "HcScjarBF95Xec3kis7bduuhP7hevykn8iqFGNqCxhs6ykaqFcZKhQ4f3F3535a";

async function conductor_init (liza){
  return await liza.callSync('dpki_happ', "dpki", "init_dpki",   {params: "{\"revocation_key\": \"HcSCIgvyd46Q4d9xa4gesx8j5tE7crna8m9U4Z63yzmf5aob6t3mKTNIp8mp8fi\",\"signed_auth_key\":\"CPhaw45L6MjxPOsVBFsTYkl35hS4h9yRNqsl1fqfNx5P6z6l6WE6aLSrBjD3Dfe3HSg3vNSHtC1QeN0FWBo+DQ==\"}"})
}

module.exports = (scenario) => {
  scenario("testing out how conductor should be set up", async(s, t) => {

    const { liza } = await s.players({ liza: simple_conductor_config('liza')}, true)

    await s.consistency()

// On conductor_init we have to make this call
    let address = await conductor_init(liza)
    t.ok(address.Ok)


// This is to just test out if we get the right keyset_root address
    const keyset_root_address = await liza.call('dpki_happ', "dpki", "get_initialization_data", {})
    // add this test when the init is fixed
    // t.equal(keyset_root_address.Ok,address.Ok)
    t.ok(keyset_root_address.Ok)

// Check if the key exist for the key
// This is befor this is created
    const checking_key_1 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_SIG_KEY_1})
    t.deepEqual(checking_key_1.Ok,"Doesn't Exists" )

// Lets create an agent key
    const key_commit = await liza.callSync('dpki_happ', "dpki", "create_agent_key", {
      agent_name:"MY_AGENT"
    })
    t.deepEqual(key_commit.Ok,null)


    let all_keys = await liza.call('dpki_happ', "dpki", "get_all_keys", {})
    t.deepEqual(all_keys.Ok.length, 2)

// Let register an apps
// In practical use this call will be called from a hApp DNA during genesis to register itself

    let apps = await liza.call('dpki_happ', "dpki", "get_registered_key", {})
    console.log("Apps: ", apps);
    t.deepEqual(apps.Ok.length, 0)

    let registered_key = await liza.call('dpki_happ', "dpki", "register_key", {app_dna_hash: "Qem...", app_name: "App Name...", public_key: all_keys.Ok[0].newKey})
    t.ok(registered_key.Ok)


    apps = await liza.call('dpki_happ', "dpki", "get_registered_key", {})
    console.log("Apps: ", apps);
    t.deepEqual(apps.Ok.length, 1)

    registered_key = await liza.call('dpki_happ', "dpki", "register_key", {app_dna_hash: "Qww...", app_name: "App2 Name...", public_key: all_keys.Ok[0].newKey})
    t.ok(registered_key.Ok)


    apps = await liza.call('dpki_happ', "dpki", "get_registered_key", {})
    console.log("Apps: ", apps);
    t.deepEqual(apps.Ok.length, 2)

/*
Check if the keys exist for the key
 Now it should exist
*/

  // Checking Agents initial Signing key
    const checking_key_2 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_SIG_KEY_1})
    t.deepEqual(checking_key_2.Ok,"live" )

  // Ceecking Agents initial Encryption key
    const checking_key_3 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_ENC_KEY_1})
    t.deepEqual(checking_key_3.Ok,"live" )

// Lets Update the keys just created
    const updated_key = await liza.callSync('dpki_happ', "dpki", "update_key", {
      old_key:AGENT_SIG_KEY_1,
      signed_old_key:SIGNED_AGENT_SIG_KEY_1_BY_REV_KEY,
      context:"NEWAGENT"
    })
    console.log("Updated Key: ",updated_key);
    t.deepEqual(updated_key.Ok,null)

// Check if the key exist for the key
// Now the old key should be shown as updated and the new should be live
    const checking_key_4 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_SIG_KEY_1})
    t.deepEqual(checking_key_4.Ok,"modified" )

    const checking_key_5 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_SIG_KEY_2})
    t.deepEqual(checking_key_5.Ok,"live" )

    const deleated_key = await liza.callSync('dpki_happ', "dpki", "delete_key", {
      old_key:AGENT_ENC_KEY_1,
      signed_old_key:SIGNED_AGENT_ENC_KEY_1_BY_REV_KEY
    })
    console.log("deleated_key: ", deleated_key);
    t.equal(deleated_key.Ok,null)
    console.log(" Deleated Key Succesfully ");

    const checking_key_6 = await liza.call('dpki_happ', "dpki", "key_status", {key:AGENT_ENC_KEY_1})
    t.deepEqual(checking_key_6.Ok,"deleted" )

    await liza.kill()
  })
}
