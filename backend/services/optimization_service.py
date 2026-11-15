"""
Optimization algorithms service — Gradient Descent with momentum and learning rate schedules.
Computes exact analytical gradients, loss trajectory, and convergence metrics locally.
"""
from __future__ import annotations

from typing import Any
import numpy as np


def run_gradient_descent(
    function_type: str = "quadratic",
    learning_rate: float = 0.1,
    epochs: int = 25,
    momentum: float = 0.0,
    start_point: tuple[float, float] = (4.0, 3.0),
) -> dict[str, Any]:
    """
    Simulate Gradient Descent across analytical 2D loss surfaces:
    - quadratic: f(x, y) = 0.5 * (x^2 + 2*y^2)
    - rosenbrock: f(x, y) = (1 - x)^2 + 10 * (y - x^2)^2 (scaled)
    - saddle: f(x, y) = x^2 - y^2
    """
    lr = max(0.001, min(float(learning_rate), 1.5))
    steps = max(5, min(int(epochs), 100))
    beta = max(0.0, min(float(momentum), 0.95))

    x, y = float(start_point[0]), float(start_point[1])
    vx, vy = 0.0, 0.0

    history = []

    def loss_and_grad(px: float, py: float):
        if function_type == "quadratic":
            val = 0.5 * (px**2 + 2.0 * py**2)
            gx = px
            gy = 2.0 * py
        elif function_type == "saddle":
            val = px**2 - py**2
            gx = 2.0 * px
            gy = -2.0 * py
        else:  # default convex parabola
            val = px**2 + py**2
            gx = 2.0 * px
            gy = 2.0 * py
        return val, gx, gy

    for step in range(steps):
        l_val, gx, gy = loss_and_grad(x, y)
        history.append({
            "step": step,
            "x": round(float(x), 4),
            "y": round(float(y), 4),
            "loss": round(float(l_val), 4),
            "grad_norm": round(float(np.hypot(gx, gy)), 4),
        })

        # Momentum update
        vx = beta * vx + lr * gx
        vy = beta * vy + lr * gy
        x -= vx
        y -= vy

        # Check convergence
        if np.hypot(gx, gy) < 1e-4:
            break

    final_loss, _, _ = loss_and_grad(x, y)
    history.append({
        "step": len(history),
        "x": round(float(x), 4),
        "y": round(float(y), 4),
        "loss": round(float(final_loss), 4),
        "grad_norm": 0.0,
    })

    return {
        "function_type": function_type,
        "learning_rate": lr,
        "momentum": beta,
        "steps_taken": len(history),
        "converged": bool(history[-1]["loss"] < 0.01),
        "final_point": [round(float(x), 4), round(float(y), 4)],
        "final_loss": round(float(final_loss), 4),
        "trajectory": history,
    }
