#
# Test and build a hApp
#
# Building requires a nix-shell, so either prefix your desired target with `make nix-...`, or enter
# a `nix-shell` and then run `make ...`
#
# This Makefile is primarily instructional; you can simply enter the Nix environment for
# holochain-rust development (supplied by holo=nixpkgs; see pkgs.nix) via `nix-shell` and run `hc
# test` directly, or build a target directly (see default.nix), eg. `nix-build -A deepkey`.
#
SHELL		= bash
DNANAME		= deepkey
DNAZOME		= dpki
DNA		= dist/$(DNANAME).dna.json

# External targets; Uses a nix-shell environment to obtain Holochain runtimes, run tests, etc.
.PHONY: all
all: nix-test

# nix-test, nix-install, ...
#
# Provides a nix-shell environment, and runs the desired Makefile target.  It is recommended that
# you add `substituters = ...` and `trusted-public-keys = ...` to your nix.conf (see README.md), to
# take advantage of cached Nix and Holo build assets.
nix-%:
	nix-shell --pure --run "make $*"

# Internal targets; require a Nix environment in order to be deterministic.
# - Uses the version of `hc`, `holochain`, `sim2h`, ... on the system PATH.
# - Normally called from within a Nix environment, eg. run `nix-shell`
.PHONY:		rebuild install build
rebuild:	clean build

install:	build

build:		$(DNA)

# Build the DNA; Specifying a custom --output requires the path to exist
# However, if the name of the directory within which `hc` is run matches the
# DNA's name, then this name is used by default, and the output directory is
# created automatically.
$(DNA):
	hc package

.PHONY: test test-unit test-e2e test-dna test-stress test-sim2h test-node
test:		test-unit test-e2e

# test-unit -- Run Rust unit tests via Cargo
test-unit:
	 RUST_BACKTRACE=1 cargo test \
	    -- --nocapture

test-dna:	$(DNA)

# End-to-end test of DNA.  Runs a sim2h_server on localhost:9000; the default expected by `hc test`
test-e2e:	test-dna test-sim2h test-node
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    RUST_BACKTRACE=1 hc test \
	        | node test/node_modules/faucet/bin/cmd.js

test-log-e2e:	test-dna test-sim2h test-node
	@echo "Starting Scenario tests..."; \
	    RUST_BACKTRACE=1 hc test

test-node:
	@echo "Setting up Scenario/Stress test Javascript..."; \
	    cd test && [ -d test/node_modules ] || npm install

test-sim2h:
	@echo "Starting sim2h_server on localhost:9000 (may already be running)..."; \
	    sim2h_server -p 9000 >sim2h_server.log 2>&1 &

# Generic targets; does not require a Nix environment
.PHONY: clean
clean:
	rm -rf \
	    dist \
	    test/node_modules \
	    .cargo \
	    target
