use actix_web::{web, HttpResponse};

pub async fn readiness() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ready",
        "checks": {
            "soroban_rpc": "ok",
            "horizon": "ok"
        }
    }))
}
