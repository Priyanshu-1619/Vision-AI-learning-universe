import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.lab_service import (
    run_logistic_regression,
    run_random_forest,
    run_svm,
    run_naive_bayes,
    run_gradient_descent,
    run_perceptron,
    run_cnn_kernel,
    run_autoencoder,
    generate_dataset
)

# Test logistic regression
ds = generate_dataset('moons', n_samples=60)
samples = [pt + [lbl] for pt, lbl in zip(ds['data'], ds['labels'])]
log_res = run_logistic_regression(samples, c_param=1.0)
print('Logistic Regression Accuracy:', log_res['accuracy'])

# Test random forest
rf_res = run_random_forest(samples, n_estimators=20)
print('Random Forest Accuracy:', rf_res['accuracy'])

# Test svm
svm_res = run_svm(samples, c_param=1.0, kernel='rbf')
print('SVM Accuracy:', svm_res['accuracy'], 'Support vectors:', svm_res['n_support_vectors'])

# Test naive bayes
nb_res = run_naive_bayes(samples)
print('Naive Bayes Accuracy:', nb_res['accuracy'])

# Test gradient descent
gd_res = run_gradient_descent(function_type='quadratic', learning_rate=0.1, epochs=15)
print('Gradient Descent Steps:', gd_res['steps_taken'], 'Final Loss:', gd_res['final_loss'])

# Test perceptron
lin_ds = generate_dataset('linear', n_samples=60)
lin_samples = [pt + [lbl] for pt, lbl in zip(lin_ds['data'], lin_ds['labels'])]
perc_res = run_perceptron(lin_samples, learning_rate=0.1, max_epochs=20)
print('Perceptron Converged:', perc_res['converged'], 'Epochs:', perc_res['epochs_taken'])

# Test cnn
cnn_res = run_cnn_kernel(kernel_type='sobel_x')
print('CNN Feature Map Shape:', cnn_res['feature_map_shape'], 'Pooled Shape:', cnn_res['pooled_shape'])

# Test autoencoder
ae_res = run_autoencoder(ds['data'], latent_dim=1)
print('Autoencoder Reconstruction MSE:', ae_res['reconstruction_mse'])
print('ALL 8 ADVANCED LAB ALGORITHMS WORKING LOCALLY!')
