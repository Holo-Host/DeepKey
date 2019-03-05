use hdk::{
    error::ZomeApiResult,
    holochain_wasm_utils::api_serialization::{
        get_entry::{GetEntryOptions,GetEntryResultType},
    },
};
use hdk::holochain_core_types::{
    entry::Entry,
    hash::HashString,
    json::RawString,
};

use crate::key_anchor::KeyAnchor;

pub fn handle_key_status(key:HashString) ->ZomeApiResult<RawString> {

    let key_anchor = Entry::App("key_anchor".into(), KeyAnchor{
        pub_key : key
    }.into());

    let key_anchor_address = hdk::entry_address(&key_anchor)?;

    if let GetEntryResultType::Single(result) = hdk::get_entry_result(
        &key_anchor_address,
        GetEntryOptions {
            entry: true,
            ..Default::default()
        },)?
        .result
        {
            match result.meta{
                Some(m)=>{
                    Ok(RawString::from(String::from(m.crud_status)))
                }
                _=> Ok(RawString::from("Doesn't Exists"))
            }
        }
    else{
        Ok(RawString::from("Doesn't Exists"))
    }
}