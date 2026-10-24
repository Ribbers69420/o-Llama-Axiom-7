#![no_std]

//! o-Llama · AXIOM-7 Offline Rust/WASM Simulation & Truth Kernel (v2.4.0 Stable LTS)
//! Target: `wasm32-unknown-unknown` · Rust Edition 2024 (`1.85.0-stable`)
//! Provides zero-allocation, deterministic integer/fixed-point routines for:
//! 1. Pulse Wave Damage & Falloff (`compute_pulse_damage`)
//! 2. 4-Pillar Weighted Truth Verification (`verify_claim_confidence`)
//! 3. 24fps Stepped Animation Time Quantization (`quantize_stepped_24fps_ms`)
//! 4. 2D Spatial Circle Hitbox Collision (`check_circle_collision_cm`)
//! 5. Kernel ABI Version Handshake (`get_kernel_abi_version` -> 20400)

#[cfg(not(test))]
#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

/// Returns the packed semantic version integer for the AXIOM-7 Rust/WASM Kernel:
/// `20400` = `v2.4.0-stable`.
#[no_mangle]
pub extern "C" fn get_kernel_abi_version() -> i32 {
    20400
}

/// Computes pulse scan damage in fixed-point centimeters.
/// - `chassis_code`: 0 = Tank, 1 = Monitor Wizard, 2 = Cosmic Being
/// - `expr_code`: 1..8 (EX-02 = 2 grants +25% scan radius)
/// - `distance_cm`: distance from AXIOM-7 to anomaly in centimeters
#[no_mangle]
pub extern "C" fn compute_pulse_damage(
    chassis_code: i32,
    expr_code: i32,
    distance_cm: i32,
) -> i32 {
    let base_radius_cm = if chassis_code == 2 {
        720
    } else if chassis_code == 1 {
        620
    } else {
        520
    };

    let effective_radius_cm = if expr_code == 2 {
        (base_radius_cm * 5) / 4
    } else {
        base_radius_cm
    };

    if distance_cm > effective_radius_cm {
        return 0;
    }

    let base_damage = if chassis_code == 2 {
        65
    } else if chassis_code == 1 {
        48
    } else {
        38
    };

    base_damage + ((effective_radius_cm - distance_cm) / 25)
}

/// Computes weighted 4-Pillar Truth Confidence score (0..100).
/// Weights: FACTS (28%), EVIDENCE (27%), DATA (25%), REALITY (20%).
#[no_mangle]
pub extern "C" fn verify_claim_confidence(
    facts: i32,
    evidence: i32,
    data: i32,
    reality: i32,
) -> i32 {
    (facts * 28 + evidence * 27 + data * 25 + reality * 20) / 100
}

/// Quantizes elapsed milliseconds onto the canonical 24fps stepped grid:
/// `stepped_ms = ((elapsed_ms * 24) / 1000) * 1000 / 24`
#[no_mangle]
pub extern "C" fn quantize_stepped_24fps_ms(elapsed_ms: i32) -> i32 {
    let frame_index = (elapsed_ms * 24) / 1000;
    (frame_index * 1000) / 24
}

/// Deterministic spatial circle collision check in fixed-point centimeters.
/// Returns 1 if `(ax - bx)^2 + (az - bz)^2 <= radius_sum^2`, else 0.
#[no_mangle]
pub extern "C" fn check_circle_collision_cm(
    ax: i32,
    az: i32,
    bx: i32,
    bz: i32,
    radius_sum: i32,
) -> i32 {
    let dx = ax - bx;
    let dz = az - bz;
    let dist_sq = dx * dx + dz * dz;
    let rad_sq = radius_sum * radius_sum;
    if dist_sq <= rad_sq {
        1
    } else {
        0
    }
}
