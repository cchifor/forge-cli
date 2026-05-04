// Generated scaffolding ships with infrastructure (config loaders, error
// variants, service-client helpers) ready for user code that may not exist
// yet. Silence the dead-code chorus crate-wide so ``cargo clippy -- -D
// warnings`` doesn't trip on unused-but-intentional items; remove this
// attribute once your service uses everything it generated.
#![allow(dead_code)]

pub mod app;
pub mod client;
pub mod config;
pub mod data;
pub mod db;
pub mod errors;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;
// FORGE:LIB_MOD_REGISTRATION
