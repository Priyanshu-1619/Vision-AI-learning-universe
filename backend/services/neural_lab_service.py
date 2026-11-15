"""
Deep learning and neural computation laboratory service.
Includes Perceptron learning, 2D CNN kernel convolution/pooling, and Autoencoder latent compression.
All algorithms execute locally via pure NumPy and scikit-learn.
"""
from __future__ import annotations

from typing import Any
import numpy as np
from sklearn.decomposition import PCA

from services.lab_datasets import validate_2d_array


def run_perceptron(
    data: list[list[float]],
    learning_rate: float = 0.1,
    max_epochs: int = 30
) -> dict[str, Any]:
    """Train single-layer Perceptron with step function activation."""
    arr = validate_2d_array(data, "data")
    if arr.shape[1] < 3:
        raise ValueError("Each sample must have at least [x1, x2, label].")

    X = arr[:, :2]
    # Map binary labels to 0 and 1
    y = (arr[:, 2] > 0).astype(int)

    n_samples, n_features = X.shape
    weights = np.zeros(n_features)
    bias = 0.0
    lr = max(0.001, min(float(learning_rate), 1.0))
    epochs = max(1, min(int(max_epochs), 100))

    epoch_history = []

    for epoch in range(epochs):
        errors = 0
        for i in range(n_samples):
            linear_output = np.dot(X[i], weights) + bias
            y_predicted = 1 if linear_output >= 0.0 else 0
            update = lr * (y[i] - y_predicted)
            if update != 0.0:
                weights += update * X[i]
                bias += update
                errors += 1

        accuracy = 1.0 - (errors / max(1, n_samples))
        epoch_history.append({
            "epoch": epoch + 1,
            "errors": errors,
            "accuracy": round(float(accuracy), 4),
            "weights": [round(float(w), 4) for w in weights],
            "bias": round(float(bias), 4),
        })

        if errors == 0:
            break

    # Calculate separating line: w1*x1 + w2*x2 + b = 0 => x2 = (-w1*x1 - b)/w2
    w1, w2 = weights[0], weights[1]
    slope = round(float(-w1 / w2), 4) if abs(w2) > 1e-5 else 0.0
    intercept = round(float(-bias / w2), 4) if abs(w2) > 1e-5 else 0.0

    return {
        "converged": bool(epoch_history[-1]["errors"] == 0),
        "epochs_taken": len(epoch_history),
        "final_accuracy": epoch_history[-1]["accuracy"],
        "weights": [round(float(w), 4) for w in weights],
        "bias": round(float(bias), 4),
        "slope": slope,
        "intercept": intercept,
        "history": epoch_history,
    }


def run_cnn_kernel(
    image_matrix: list[list[float]] | None = None,
    kernel_type: str = "sobel_x",
    stride: int = 1,
    padding: int = 0
) -> dict[str, Any]:
    """
    Apply 2D spatial convolution with educational kernels and max pooling:
    - sobel_x (vertical edge)
    - sobel_y (horizontal edge)
    - edge_detection (Laplacian)
    - sharpen
    - gaussian_blur
    """
    KERNELS = {
        "sobel_x": np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float),
        "sobel_y": np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=float),
        "edge_detection": np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], dtype=float),
        "sharpen": np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=float),
        "gaussian_blur": np.array([[1/16, 2/16, 1/16], [2/16, 4/16, 2/16], [1/16, 2/16, 1/16]], dtype=float),
    }

    kernel = KERNELS.get(kernel_type, KERNELS["sobel_x"])

    # Default synthetic 8x8 checkerboard/cross image if none provided
    if not image_matrix:
        img = np.zeros((8, 8), dtype=float)
        img[2:6, 2:6] = 1.0
        img[3:5, 1:7] = 1.0
    else:
        img = np.array(image_matrix, dtype=float)

    h, w = img.shape
    kh, kw = kernel.shape
    p = max(0, min(int(padding), 2))
    s = max(1, min(int(stride), 2))

    # Apply padding
    if p > 0:
        padded_img = np.pad(img, ((p, p), (p, p)), mode="constant", constant_values=0)
    else:
        padded_img = img

    ph, pw = padded_img.shape
    out_h = (ph - kh) // s + 1
    out_w = (pw - kw) // s + 1

    feature_map = np.zeros((out_h, out_w), dtype=float)

    for i in range(out_h):
        for j in range(out_w):
            window = padded_img[i*s : i*s + kh, j*s : j*s + kw]
            feature_map[i, j] = np.sum(window * kernel)

    # ReLU activation
    activated_map = np.maximum(0.0, feature_map)

    # 2x2 Max Pooling
    pool_h = out_h // 2
    pool_w = out_w // 2
    pooled_map = np.zeros((pool_h, pool_w), dtype=float)
    for i in range(pool_h):
        for j in range(pool_w):
            pooled_map[i, j] = np.max(activated_map[i*2 : i*2 + 2, j*2 : j*2 + 2])

    return {
        "kernel_type": kernel_type,
        "kernel_matrix": kernel.round(3).tolist(),
        "input_shape": [h, w],
        "input_image": img.round(2).tolist(),
        "feature_map_shape": [out_h, out_w],
        "feature_map": feature_map.round(3).tolist(),
        "relu_feature_map": activated_map.round(3).tolist(),
        "pooled_shape": [pool_h, pool_w],
        "pooled_map": pooled_map.round(3).tolist(),
    }


def run_autoencoder(
    data: list[list[float]],
    latent_dim: int = 1
) -> dict[str, Any]:
    """
    Linear autoencoder using SVD / Principal Component subspace projection.
    Encodes higher dimensional data to bottleneck latent space z and reconstructs.
    """
    arr = validate_2d_array(data, "data")
    X = arr[:, :2]

    # Center data
    mean = np.mean(X, axis=0)
    X_centered = X - mean

    pca = PCA(n_components=latent_dim)
    latent_z = pca.fit_transform(X_centered)
    X_reconstructed = pca.inverse_transform(latent_z) + mean

    mse = float(np.mean((X - X_reconstructed) ** 2))

    return {
        "original_shape": list(X.shape),
        "latent_dim": latent_dim,
        "reconstruction_mse": round(mse, 4),
        "explained_variance_ratio": [round(float(v), 4) for v in pca.explained_variance_ratio_],
        "latent_embeddings": latent_z.round(3).tolist()[:40],
        "reconstructed_samples": X_reconstructed.round(3).tolist()[:40],
    }
