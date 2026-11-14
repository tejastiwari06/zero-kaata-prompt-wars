export type QuestionDifficulty = 'Easy' | 'Medium' | 'Difficult' | 'Advanced';

export interface AIMLQuestion {
  id: string;
  topic: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  fingerprint?: string;
}

export interface PlayerAnswerSubmission {
  playerId: string;
  playerSymbol: string;
  option: 'A' | 'B' | 'C' | 'D';
  timestamp: number;
}

export interface QuestionBattleState {
  question: AIMLQuestion | null;
  deadline: number; // Unix timestamp in ms
  status: 'idle' | 'active' | 'resolved' | 'expired';
  winner: string | null;
  winnerSymbol: string | null;
  explanationVisible: boolean;
  p1Answer: { option: string; isCorrect: boolean; timestamp: number } | null;
  p2Answer: { option: string; isCorrect: boolean; timestamp: number } | null;
  aiAnswer: { option: string; isCorrect: boolean; timestamp: number } | null;
}

export interface MovePermission {
  playerId: string;
  playerSymbol: string;
  grantedAt: number;
  consumed: boolean;
  questionId: string;
}

export class AIMLQuestionEngine {
  public static QUESTION_DURATION_SECONDS = 20;
  public static QUESTION_DURATION_MS = 20000;

  // Comprehensive 4-tier curated question bank
  public static CURATED_QUESTIONS: AIMLQuestion[] = [
    // --- TIER 1: EASY (~20% target) ---
    {
      id: 'ml_easy_1',
      topic: 'Supervised Learning',
      difficulty: 'Easy',
      question: 'Which machine learning paradigm uses labeled input-output pairs to train a mapping function?',
      options: {
        A: 'Supervised Learning',
        B: 'Unsupervised Clustering',
        C: 'Self-Supervised Contrastive Learning',
        D: 'Model-Free Reinforcement Learning'
      },
      answer: 'A',
      explanation: 'Supervised learning trains models on labeled datasets where each input vector x is paired with a known ground-truth output label y.'
    },
    {
      id: 'ml_easy_2',
      topic: 'Activation Functions',
      difficulty: 'Easy',
      question: 'What is the mathematical output range of the standard logistic Sigmoid function sigma(z) = 1 / (1 + exp(-z))?',
      options: {
        A: '(0, 1)',
        B: '[-1, 1]',
        C: '[0, +inf)',
        D: '(-inf, +inf)'
      },
      answer: 'A',
      explanation: 'The logistic sigmoid function asymptotically maps any real number to the open interval (0, 1), making it ideal for interpreting scalar outputs as Bernoulli probabilities.'
    },
    {
      id: 'ml_easy_3',
      topic: 'Loss Functions',
      difficulty: 'Easy',
      question: 'Which loss function is standard for evaluating continuous regression models by penalizing larger errors quadratically?',
      options: {
        A: 'Mean Squared Error (MSE)',
        B: 'Binary Cross-Entropy Loss',
        C: 'Categorical Cross-Entropy',
        D: 'Hinge Loss'
      },
      answer: 'A',
      explanation: 'MSE computes (1/N) * sum (y_i - y_hat_i)^2. The squaring operation penalizes larger residuals proportionally more than smaller ones.'
    },
    {
      id: 'ml_easy_4',
      topic: 'Model Evaluation',
      difficulty: 'Easy',
      question: 'In a binary classification confusion matrix, what is the exact formula for Accuracy?',
      options: {
        A: '(TP + TN) / (TP + TN + FP + FN)',
        B: 'TP / (TP + FP)',
        C: 'TP / (TP + FN)',
        D: '2 * (Precision * Recall) / (Precision + Recall)'
      },
      answer: 'A',
      explanation: 'Accuracy is the ratio of correctly classified predictions (True Positives + True Negatives) to total evaluated samples.'
    },
    {
      id: 'ml_easy_5',
      topic: 'Generalization & Overfitting',
      difficulty: 'Easy',
      question: 'When a model achieves near-zero error on training data but performs poorly on unseen test data, what is this called?',
      options: {
        A: 'Overfitting',
        B: 'Underfitting',
        C: 'High Bias',
        D: 'Under-parameterization'
      },
      answer: 'A',
      explanation: 'Overfitting occurs when a high-capacity model memorizes noise and idiosyncrasies in the training set rather than learning generalizable patterns.'
    },
    {
      id: 'ml_easy_6',
      topic: 'Neural Networks',
      difficulty: 'Easy',
      question: 'Why are non-linear activation functions necessary between layers of a multi-layer neural network?',
      options: {
        A: 'Without non-linearities, any stack of linear layers collapses mathematically into a single linear transformation.',
        B: 'They prevent all weights from becoming negative.',
        C: 'They eliminate the need to calculate backpropagation gradients.',
        D: 'They enforce sparse zero weights at initialization.'
      },
      answer: 'A',
      explanation: 'Since matrix multiplication is linear, W2 * (W1 * x) = (W2 * W1) * x = W_comb * x. Non-linear activations allow networks to approximate arbitrary non-linear functions.'
    },
    {
      id: 'ml_easy_7',
      topic: 'Optimization',
      difficulty: 'Easy',
      question: 'What hyperparameter controls the step size taken along the negative gradient direction during gradient descent?',
      options: {
        A: 'Learning rate (eta)',
        B: 'Batch size',
        C: 'Momentum coefficient',
        D: 'Weight decay lambda'
      },
      answer: 'A',
      explanation: 'In parameter update theta_{t+1} = theta_t - eta * grad_L, eta (learning rate) directly scales the gradient step size.'
    },
    {
      id: 'ml_easy_8',
      topic: 'Unsupervised Learning',
      difficulty: 'Easy',
      question: 'Which algorithm is a classic iterative centroid-based clustering technique that partitions data into k distinct clusters?',
      options: {
        A: 'K-Means Clustering',
        B: 'Random Forest',
        C: 'Linear Discriminant Analysis',
        D: 'Support Vector Machine'
      },
      answer: 'A',
      explanation: 'K-Means alternates between assigning points to the nearest centroid and updating centroids to the mean of assigned points until convergence.'
    },

    // --- TIER 2: MEDIUM (~35% target) ---
    {
      id: 'ml_med_1',
      topic: 'Bias-Variance Tradeoff',
      difficulty: 'Medium',
      question: 'In the bias-variance decomposition of expected test MSE, what does the bias term measure?',
      options: {
        A: 'Error resulting from erroneous or overly simplistic assumptions in the learning algorithm.',
        B: 'Sensitivity of model predictions to small fluctuations in the training dataset.',
        C: 'Irreducible noise inherent to the data-generating process sigma^2.',
        D: 'The condition number of the feature covariance matrix.'
      },
      answer: 'A',
      explanation: 'Bias measures how far the expected model prediction across infinite training draws deviates from the true underlying function. High bias implies underfitting.'
    },
    {
      id: 'ml_med_2',
      topic: 'Regularization',
      difficulty: 'Medium',
      question: 'What is the primary structural difference between L1 (Lasso) and L2 (Ridge) weight penalties in linear models?',
      options: {
        A: 'L1 penalizes absolute weights inducing sparsity (exact zeros); L2 penalizes squared weights shrinking them smoothly.',
        B: 'L2 eliminates features completely while L1 retains all features with small weights.',
        C: 'L1 is strictly restricted to positive features while L2 allows negative features.',
        D: 'L2 requires non-differentiable subgradient optimization.'
      },
      answer: 'A',
      explanation: 'L1 has non-differentiable sharp corners along the coordinate axes where the loss contours intersect at zero, causing feature selection. L2 penalizes squared norms smoothly toward zero.'
    },
    {
      id: 'ml_med_3',
      topic: 'Convolutional Neural Networks',
      difficulty: 'Medium',
      question: 'What is the primary purpose of a Max Pooling layer in a Convolutional Neural Network (CNN)?',
      options: {
        A: 'Downsampling spatial dimensions to reduce computation and provide local translational invariance.',
        B: 'Increasing channel dimensionality to capture fine-grained texture features.',
        C: 'Normalizing activation values to zero mean and unit variance.',
        D: 'Projecting feature vectors onto orthogonal latent subspaces.'
      },
      answer: 'A',
      explanation: 'Max pooling extracts the maximum activation in local spatial windows (e.g. 2x2), halving spatial height and width while retaining the strongest feature responses.'
    },
    {
      id: 'ml_med_4',
      topic: 'Backpropagation',
      difficulty: 'Medium',
      question: 'What fundamental calculus principle enables computing gradients through arbitrary compositions of differentiable layers in deep networks?',
      options: {
        A: 'The Chain Rule of differentiation',
        B: 'L\'Hopital\'s Rule',
        C: 'The Mean Value Theorem',
        D: 'Taylor Series Truncation'
      },
      answer: 'A',
      explanation: 'Backpropagation applies the Chain Rule recursively from the loss layer back to shallow layers: dL/dx = (dL/dy) * (dy/dx).'
    },
    {
      id: 'ml_med_5',
      topic: 'Data Leakage',
      difficulty: 'Medium',
      question: 'Why must feature normalization (e.g. StandardScaler) be fit exclusively on training data and not the full dataset before splitting?',
      options: {
        A: 'Fitting on the full dataset leaks information about the mean and variance of the test set into the training process.',
        B: 'StandardScaler throws a runtime exception if the test set is included.',
        C: 'Test set feature values are always strictly non-negative.',
        D: 'Fitting on training data guarantees zero variance for all features.'
      },
      answer: 'A',
      explanation: 'Computing mean and variance over the combined train+test sets is a subtle form of data leakage, producing overly optimistic validation metrics that degrade in production.'
    },
    {
      id: 'ml_med_6',
      topic: 'Cross-Validation',
      difficulty: 'Medium',
      question: 'In standard k-fold cross-validation with k = 5, what percentage of the dataset is used for model training in each fold iteration?',
      options: {
        A: '80%',
        B: '20%',
        C: '50%',
        D: '95%'
      },
      answer: 'A',
      explanation: 'The dataset is partitioned into 5 equal folds. In each iteration, 4 folds (80%) train the model and 1 fold (20%) evaluates it.'
    },
    {
      id: 'ml_med_7',
      topic: 'Word Embeddings',
      difficulty: 'Medium',
      question: 'What is the objective of the Word2Vec Skip-gram model during training?',
      options: {
        A: 'Predicting surrounding context words given a target center word within a sliding window.',
        B: 'Predicting the target center word given a bag of surrounding context words.',
        C: 'Computing singular value decomposition on global co-occurrence matrices.',
        D: 'Encoding documents into fixed-length topic distribution vectors.'
      },
      answer: 'A',
      explanation: 'Skip-gram takes center word w_t and maximizes the log probability of context words w_{t+j} within window size c using softmax over dot products.'
    },
    {
      id: 'ml_med_8',
      topic: 'Attention Basics',
      difficulty: 'Medium',
      question: 'In Scaled Dot-Product Attention Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V, why is the inner product scaled by sqrt(d_k)?',
      options: {
        A: 'To prevent dot products from growing excessively large in high dimensions, which pushes softmax into vanishing gradient regions.',
        B: 'To regularize the rank of the resulting attention matrix to rank 1.',
        C: 'To ensure the value vectors V have zero mean.',
        D: 'To enforce orthogonality between query and key projection matrices.'
      },
      answer: 'A',
      explanation: 'For independent zero-mean unit-variance components, the variance of QK^T is d_k. Dividing by sqrt(d_k) restores unit variance, preventing softmax saturation.'
    },
    {
      id: 'ml_med_9',
      topic: 'Vanishing Gradients',
      difficulty: 'Medium',
      question: 'Why does the standard sigmoid activation function cause vanishing gradients in deep feedforward architectures with many layers?',
      options: {
        A: 'Its derivative attains a maximum of only 0.25, exponentially shrinking gradient magnitudes when chained across multiple layers.',
        B: 'Its derivative is discontinuous at z = 0.',
        C: 'It produces strictly negative activation values.',
        D: 'It causes weight matrices to become singular.'
      },
      answer: 'A',
      explanation: 'Since d sigma / dz = sigma(z)*(1 - sigma(z)) <= 0.25, multiplying derivatives across L layers shrinks the backpropagated gradient by at least 0.25^L, causing vanishing gradients.'
    },
    {
      id: 'ml_med_10',
      topic: 'Overfitting Mitigation',
      difficulty: 'Medium',
      question: 'How does Dropout behave during training versus inference in a deep neural network?',
      options: {
        A: 'Units are randomly set to zero with probability p during training; at inference, all units are active and outputs are scaled by (1 - p).',
        B: 'Units are dropped at inference time to speed up model latency.',
        C: 'Dropout adds Gaussian noise to the weights during both training and inference.',
        D: 'Dropout computes moving averages of layer activations during training.'
      },
      answer: 'A',
      explanation: 'During training, dropout samples subnetworks by zeroing activations with probability p. At inference, weights or activations are scaled by (1 - p) to preserve expected activation magnitude.'
    },
    {
      id: 'ml_med_11',
      topic: 'Optimization',
      difficulty: 'Medium',
      question: 'In Stochastic Gradient Descent (SGD) with momentum, what is the role of the momentum term?',
      options: {
        A: 'Accelerating updates along consistent gradient dimensions while dampening oscillations in high-curvature directions.',
        B: 'Dynamically increasing the learning rate whenever gradients become small.',
        C: 'Clipping the maximum norm of parameter weight tensors.',
        D: 'Computing exact second-order Hessian inverses.'
      },
      answer: 'A',
      explanation: 'Momentum accumulates exponentially decaying moving averages of past gradients: v_t = gamma * v_{t-1} + eta * g_t, stabilizing descent trajectories.'
    },
    {
      id: 'ml_med_12',
      topic: 'Evaluation Metrics',
      difficulty: 'Medium',
      question: 'When evaluating a binary classifier under severe class imbalance (e.g. 99% negative, 1% positive), why is standard Accuracy misleading?',
      options: {
        A: 'A trivial classifier predicting all negatives attains 99% accuracy while detecting zero true positives.',
        B: 'Accuracy cannot be computed when negative samples exceed positive samples.',
        C: 'Accuracy is only mathematically defined for multi-class classification.',
        D: 'The confusion matrix cannot be constructed under class imbalance.'
      },
      answer: 'A',
      explanation: 'Because negatives dominate the denominator, trivial majority-class predictions yield high accuracy despite complete failure on the minority class of interest.'
    },

    // --- TIER 3: DIFFICULT (~30% target) ---
    {
      id: 'ml_diff_1',
      topic: 'Contrastive Learning',
      difficulty: 'Difficult',
      question: 'Why does contrastive learning (e.g. SimCLR NT-Xent loss) benefit critically from temperature scaling tau in the softmax denominator?',
      options: {
        A: 'It prevents the gradient of hard negatives from vanishing by tuning distribution sharpness.',
        B: 'It guarantees that representation norms collapse to a single uniform point on the hypersphere.',
        C: 'It eliminates the requirement of computing negative pair dot-products.',
        D: 'It strictly enforces zero cosine distance between orthogonal latent vectors.'
      },
      answer: 'A',
      explanation: 'Temperature tau controls sensitivity to hard negative samples: lower tau penalizes hard negatives more aggressively, preventing uniform representation collapse while maintaining gradient signal.'
    },
    {
      id: 'ml_diff_2',
      topic: 'Transformers & Attention',
      difficulty: 'Difficult',
      question: 'In FlashAttention-2, what key algorithmic insight enables a ~2-4x speedup over standard Multi-Head Attention on modern GPUs?',
      options: {
        A: 'Tiling inputs into SRAM blocks and online softmax scaling to avoid materializing the full N x N matrix in HBM.',
        B: 'Replacing the softmax nonlinearity with a piecewise linear ReLU approximation.',
        C: 'Pruning 75% of query-key inner products based on magnitude thresholding.',
        D: 'Distributing query projections across CPU threads via asynchronous PCI-e DMA transfers.'
      },
      answer: 'A',
      explanation: 'FlashAttention computes exact attention by tiling Q, K, and V into fast GPU SRAM, maintaining running softmax normalization statistics without writing intermediate N x N attention matrices to slow HBM.'
    },
    {
      id: 'ml_diff_3',
      topic: 'Deep Learning Optimization',
      difficulty: 'Difficult',
      question: 'In the Adam optimizer, why are first (m_t) and second (v_t) moment estimates corrected by (1 - beta_1^t) and (1 - beta_2^t)?',
      options: {
        A: 'To eliminate the initialization bias toward zero during early optimization steps.',
        B: 'To regularize weight decay linearly with the current epoch step count.',
        C: 'To dynamically modulate the learning rate according to spectral norm upper bounds.',
        D: 'To enforce orthogonal updates across distinct parameter sub-tensors.'
      },
      answer: 'A',
      explanation: 'Because m_0 and v_0 are initialized to zero, exponential moving averages are heavily biased toward zero in early iterations. Dividing by (1 - beta^t) yields unbiased estimators.'
    },
    {
      id: 'ml_diff_4',
      topic: 'Deep Learning Architectures',
      difficulty: 'Difficult',
      question: 'What is the primary operational difference between Layer Normalization (LayerNorm) and Batch Normalization (BatchNorm) at inference time?',
      options: {
        A: 'BatchNorm uses fixed running mean/variance tracked during training, whereas LayerNorm computes statistics per sample across channels/features dynamically.',
        B: 'LayerNorm requires caching running population statistics, whereas BatchNorm computes them dynamically.',
        C: 'LayerNorm is strictly restricted to 1D signals and cannot normalize spatial activations.',
        D: 'BatchNorm normalizes across hidden feature dimensions independently for each sequence token.'
      },
      answer: 'A',
      explanation: 'BatchNorm uses frozen running mean and variance vectors accumulated during training. LayerNorm computes mean and variance dynamically on each individual sample across feature dimensions.'
    },
    {
      id: 'ml_diff_5',
      topic: 'Residual Connections',
      difficulty: 'Difficult',
      question: 'What is the theoretical justification for the residual connection x + F(x) in ResNets preventing vanishing gradients?',
      options: {
        A: 'The gradient dE/dx = dE/dy * (I + dF/dx) includes an identity term I, ensuring a direct highway for gradient propagation regardless of dF/dx.',
        B: 'It multiplies the gradient Jacobian by an orthogonal unitary factor at every layer.',
        C: 'It replaces non-convex loss surfaces with strictly quadratic bowls.',
        D: 'It constrains all weight eigenvalues to lie strictly inside the complex unit circle.'
      },
      answer: 'A',
      explanation: 'By the chain rule, dE/dx_l = dE/dx_L * (I + sum dF/dx), so gradients can flow directly from output layer L back to shallow layer l without vanishing exponentially.'
    },
    {
      id: 'ml_diff_6',
      topic: 'Self-Supervised Learning',
      difficulty: 'Difficult',
      question: 'In Masked Autoencoders (MAE), why can the ViT encoder process only a small fraction (e.g. 25%) of visible image patches, while standard BERT must process 100% of tokens?',
      options: {
        A: 'MAE completely deletes masked patch tokens before feeding them to the encoder, processing only unmasked tokens to save compute.',
        B: 'Images have lower spatial dimensionality than natural language tokens.',
        C: 'MAE uses 2D spatial convolution instead of self-attention.',
        D: 'Visible patches are merged using pixel average pooling.'
      },
      answer: 'A',
      explanation: 'MAE discards masked patches completely during the heavy encoder pass, executing self-attention only on the 25% visible patches. Mask tokens are only introduced in the lightweight decoder.'
    },
    {
      id: 'ml_diff_7',
      topic: 'Model Distillation',
      difficulty: 'Difficult',
      question: 'In Hinton-style knowledge distillation, what is the role of temperature T in the teacher and student softened softmax distributions?',
      options: {
        A: 'Higher T softens probabilities, revealing rich "dark knowledge" (relative similarities across negative non-target classes).',
        B: 'Higher T drives the output toward a discrete one-hot vector.',
        C: 'Lower T prevents the student gradients from overflowing.',
        D: 'T scales the learning rate exponentially with model depth.'
      },
      answer: 'A',
      explanation: 'At T=1, probabilities of incorrect classes are nearly zero. Elevating T softens the distribution, revealing structural similarities between classes that the teacher discovered.'
    },
    {
      id: 'ml_diff_8',
      topic: 'Optimization & Numerical Stability',
      difficulty: 'Difficult',
      question: 'In deep network loss functions, why is Cross-Entropy formulated using log-sum-exp stabilization instead of naive exp(z_i) / sum exp(z_j)?',
      options: {
        A: 'Subtracting max(z) before exp prevents numerical overflow (inf) while adding a log shift prevents underflow to 0.',
        B: 'It reduces the asymptotic complexity of softmax from O(N) to O(log N).',
        C: 'It forces logits to be strictly orthogonal to the ground-truth one-hot label.',
        D: 'It removes negative eigenvalues from the loss Hessian matrix.'
      },
      answer: 'A',
      explanation: 'For large logits z_i, exp(z_i) overflows 32-bit floats to inf (yielding NaN). The identity log(sum exp(z_i)) = c + log(sum exp(z_i - c)) with c = max(z) guarantees all exponents <= 0.'
    },
    {
      id: 'ml_diff_9',
      topic: 'Rotary Position Embedding',
      difficulty: 'Difficult',
      question: 'What mathematical property of Rotary Position Embedding (RoPE) ensures relative position awareness in Multi-Head Attention?',
      options: {
        A: 'The inner product <R_m q, R_n k> depends strictly on the relative distance (m - n) via a complex rotation matrix.',
        B: 'It adds learnable sinusoidal bias vectors directly to the feedforward activation tensors.',
        C: 'It masks attention scores exponentially based on absolute token indices.',
        D: 'It projects query and key vectors onto Chebyshev polynomial orthogonal bases.'
      },
      answer: 'A',
      explanation: 'RoPE applies an orthogonal block-diagonal rotation matrix R_m to queries and R_n to keys. In complex coordinates, <R_m q, R_n k> = Re[q* (R_{m-n} k)], so attention scores depend purely on relative offset (m - n).'
    },
    {
      id: 'ml_diff_10',
      topic: 'Machine Learning Evaluation',
      difficulty: 'Difficult',
      question: 'In an extreme class-imbalanced binary classification setting (99.9% negative, 0.1% positive), why is PR-AUC preferred over ROC-AUC?',
      options: {
        A: 'The True Negative Rate in the ROC denominator is dominated by huge negative counts, masking large numbers of false positives, whereas PR-AUC explicitly tracks Precision.',
        B: 'ROC-AUC cannot be calculated if the true negative count is non-zero.',
        C: 'PR-AUC is invariant to monotonic probability calibration scaling.',
        D: 'ROC-AUC strictly penalizes precision drops more severely than recall drops.'
      },
      answer: 'A',
      explanation: 'In ROC, FPR = FP / (FP + TN). When TN is huge, FPR remains deceptively tiny even if FP is orders of magnitude larger than TP. PR-AUC focuses on Precision = TP / (TP + FP) and Recall.'
    },

    // --- TIER 4: ADVANCED (~15% target) ---
    {
      id: 'ml_adv_1',
      topic: 'Linear Algebra: SVD',
      difficulty: 'Advanced',
      question: 'According to the Eckart-Young-Mirsky Theorem, what is the optimal rank-k approximation of a matrix A under the Frobenius norm?',
      options: {
        A: 'A_k = sum_{i=1}^k sigma_i u_i v_i^T, obtained by truncating the Singular Value Decomposition to the top k singular values.',
        B: 'The Cholesky factorization L * L^T evaluated at the k-th diagonal pivot.',
        C: 'The QR decomposition Q_k * R_k computed with Householder reflectors.',
        D: 'The diagonal projection matrix diag(A) scaled by the top-k trace elements.'
      },
      answer: 'A',
      explanation: 'The Eckart-Young-Mirsky Theorem proves that the truncated SVD A_k = sum_{i=1}^k sigma_i u_i v_i^T minimizes ||A - B||_F over all matrices B of rank at most k.'
    },
    {
      id: 'ml_adv_2',
      topic: 'Information Theory: Entropy',
      difficulty: 'Advanced',
      question: 'What continuous probability distribution uniquely maximizes differential entropy for a fixed mean and variance sigma^2 on (-inf, +inf)?',
      options: {
        A: 'Gaussian (Normal) distribution N(mu, sigma^2)',
        B: 'Uniform distribution on [-sqrt(3)*sigma, sqrt(3)*sigma]',
        C: 'Laplace distribution with scale b = sigma / sqrt(2)',
        D: 'Cauchy distribution with scale gamma = sigma'
      },
      answer: 'A',
      explanation: 'By the maximum entropy principle using Lagrange multipliers with constraints on normalization and second moment, the Gaussian distribution uniquely maximizes differential entropy.'
    },
    {
      id: 'ml_adv_3',
      topic: 'Information Theory: KL Divergence',
      difficulty: 'Advanced',
      question: 'For two continuous probability distributions P and Q, what does Kullback-Leibler divergence D_KL(P || Q) quantify, and what is its symmetry property?',
      options: {
        A: 'It quantifies relative entropy (information loss) when using Q to approximate P; it is non-negative and generally asymmetric.',
        B: 'It is a symmetric Euclidean metric quantifying the geometric distance between covariance matrices.',
        C: 'It measures total variation bounded between -1 and +1, satisfying the triangle inequality.',
        D: 'It computes the cosine angle between probability density gradient vectors on a Riemannian manifold.'
      },
      answer: 'A',
      explanation: 'KL divergence D_KL(P || Q) = int P(x) log(P(x)/Q(x)) dx measures expected information loss. By Gibbs inequality, D_KL(P || Q) >= 0, with equality iff P = Q; in general D_KL(P || Q) != D_KL(Q || P).'
    },
    {
      id: 'ml_adv_4',
      topic: 'Distributed Systems: ZeRO-3',
      difficulty: 'Advanced',
      question: 'In Zero Redundancy Optimizer Stage 3 (ZeRO-3), how are model states partitioned across data-parallel ranks to fit 100B+ parameter models?',
      options: {
        A: 'Optimizer states, gradients, and model parameters are all partitioned across ranks and gathered via all-gather dynamically right before layer execution.',
        B: 'Only optimizer states are partitioned; gradients and parameters are replicated.',
        C: 'Weights are offloaded strictly to CPU RAM via PCIe and never stored in GPU VRAM.',
        D: 'Layers are split across distinct pipeline stages with 1F1B schedule.'
      },
      answer: 'A',
      explanation: 'ZeRO Stage 1 partitions optimizer states; Stage 2 partitions gradients; Stage 3 partitions all model parameters across data-parallel ranks, dynamically fetching weights via all-gather and discarding them immediately after each layer.'
    },
    {
      id: 'ml_adv_5',
      topic: 'Parameter-Efficient Fine-Tuning',
      difficulty: 'Advanced',
      question: 'In Low-Rank Adaptation (LoRA), how are adapter weight matrices A in R^{r x d_in} and B in R^{d_out x r} typically initialized before fine-tuning?',
      options: {
        A: 'A is initialized with Gaussian noise and B is initialized to zero, so Delta W = B*A = 0 at step 0.',
        B: 'Both A and B are initialized to identity matrices I_r.',
        C: 'Both A and B are initialized with zero vectors.',
        D: 'A is initialized to zero and B is initialized with Xavier uniform noise.'
      },
      answer: 'A',
      explanation: 'Setting B = 0 and A ~ N(0, sigma^2) ensures that the perturbation Delta W = B * A is strictly zero at the beginning of training, preserving the pre-trained model outputs.'
    },
    {
      id: 'ml_adv_6',
      topic: 'Quantization',
      difficulty: 'Advanced',
      question: 'In asymmetric uniform 8-bit integer quantization, how are real-valued tensor values x converted to quantized integers q in [0, 255]?',
      options: {
        A: 'q = clamp(round(x / S) + Z, 0, 255) where S is scale and Z is integer zero-point.',
        B: 'q = round(x * 128) + 127',
        C: 'q = floor(log2(abs(x))) * sign(x)',
        D: 'q = round(softmax(x) * 255)'
      },
      answer: 'A',
      explanation: 'Asymmetric quantization maps [x_min, x_max] to [0, 255] using scale S = (x_max - x_min) / 255 and integer zero-point Z = round(-x_min / S), computed as q = clamp(round(x / S) + Z, 0, 255).'
    },
    {
      id: 'ml_adv_7',
      topic: 'Reinforcement Learning: DPO',
      difficulty: 'Advanced',
      question: 'In Direct Preference Optimization (DPO), how is the policy objective derived from traditional RLHF with a Bradley-Terry reward model?',
      options: {
        A: 'By expressing the ground-truth reward analytically as implicit log-ratio r(x,y) = beta * log(pi_theta(y|x) / pi_ref(y|x)), substituting directly into the loss.',
        B: 'By training an explicit neural reward model and taking Monte Carlo policy rollouts.',
        C: 'By replacing cross-entropy loss with mean squared error over preferred token logits.',
        D: 'By optimizing actor-critic networks using Generalized Advantage Estimation over human ranking scores.'
      },
      answer: 'A',
      explanation: 'DPO uses the closed-form relationship between optimal policy and reward in Bradley-Terry models, substituting r(x,y) = beta * log(pi / pi_ref) directly into the objective, bypassing explicit reward modeling.'
    },
    {
      id: 'ml_adv_8',
      topic: 'Optimization Bounds',
      difficulty: 'Advanced',
      question: 'Under what condition does gradient descent with step size eta converge for a beta-smooth convex function f(x)?',
      options: {
        A: '0 < eta < 2 / beta',
        B: 'eta >= beta / 2',
        C: 'eta = beta^2',
        D: 'eta < 1 / (2 * beta^2)'
      },
      answer: 'A',
      explanation: 'For a beta-smooth convex function (Lipschitz continuous gradient with constant beta), the standard descent lemma proves that gradient descent monotonically decreases the objective whenever 0 < eta < 2 / beta.'
    }
  ];

  // Procedural mathematical & system engineering question generators (Difficult / Advanced)
  private static PROCEDURAL_GENERATORS = [
    // 1. LoRA Parameter Count
    (seed: number): AIMLQuestion => {
      const dModels = [768, 1024, 2048, 4096];
      const ranks = [4, 8, 16, 32];
      const layers = [16, 24, 32];
      const d = dModels[seed % dModels.length];
      const r = ranks[(seed >> 2) % ranks.length];
      const L = layers[(seed >> 4) % layers.length];
      const correctParams = 2 * L * (2 * d * r);
      const d1 = L * (2 * d * r);
      const d2 = 2 * L * (d * d);
      const d3 = 2 * L * (d * r);

      const qId = `proc_lora_${d}_${r}_${L}`;
      return {
        id: qId,
        topic: 'Parameter-Efficient Fine-Tuning',
        difficulty: 'Difficult',
        question: `A transformer model has hidden dimension d = ${d} and L = ${L} layers. You apply LoRA with rank r = ${r} exclusively to Query and Value projections. What is the total count of trainable adapter parameters?`,
        options: {
          A: `${correctParams.toLocaleString()} parameters`,
          B: `${d1.toLocaleString()} parameters`,
          C: `${d2.toLocaleString()} parameters`,
          D: `${d3.toLocaleString()} parameters`
        },
        answer: 'A',
        explanation: `Each layer has 2 adapted matrices (Q, V). Each requires matrices A (d x r) and B (r x d) totaling 2*d*r parameters. Across ${L} layers: 2 * ${L} * (2 * ${d} * ${r}) = ${correctParams.toLocaleString()} parameters.`
      };
    },

    // 2. KV Cache Memory Calculation
    (seed: number): AIMLQuestion => {
      const batches = [1, 4, 8, 16];
      const seqLens = [1024, 2048, 4096];
      const layers = [24, 32];
      const d = 4096;
      const b = batches[seed % batches.length];
      const s = seqLens[(seed >> 2) % seqLens.length];
      const L = layers[(seed >> 4) % layers.length];
      const bytesTotal = 2 * b * s * L * d * 2;
      const mb = Math.round(bytesTotal / (1024 * 1024));
      const mbD1 = Math.round(mb / 2);
      const mbD2 = Math.round(mb * 2);
      const mbD3 = Math.round(mb * 1.5);

      const qId = `proc_kv_${b}_${s}_${L}`;
      return {
        id: qId,
        topic: 'LLM Systems & Inference',
        difficulty: 'Advanced',
        question: `For a transformer with hidden size d = ${d}, L = ${L} layers in FP16 (2 bytes/elem), what is the total KV cache memory allocated for batch size B = ${b} and context length S = ${s}?`,
        options: {
          A: `~${mb} MB`,
          B: `~${mbD1} MB`,
          C: `~${mbD2} MB`,
          D: `~${mbD3} MB`
        },
        answer: 'A',
        explanation: `KV cache memory = 2 (Key + Value) * B * S * L * d * 2 bytes = 2 * ${b} * ${s} * ${L} * ${d} * 2 = ${bytesTotal.toLocaleString()} bytes = ~${mb} MB.`
      };
    },

    // 3. FLOPs in Multi-Head Attention QK^T
    (seed: number): AIMLQuestion => {
      const Ns = [1024, 2048, 4096];
      const heads = [8, 16, 32];
      const dk = 64;
      const N = Ns[seed % Ns.length];
      const h = heads[(seed >> 2) % heads.length];
      const flopsG = Math.round((2 * h * (N * N) * dk) / 1e9 * 100) / 100;
      const d1 = Math.round((flopsG * 2) * 100) / 100;
      const d2 = Math.round((flopsG / 2) * 100) / 100;
      const d3 = Math.round((flopsG * 4) * 100) / 100;

      const qId = `proc_flops_${N}_${h}`;
      return {
        id: qId,
        topic: 'Transformer Complexity',
        difficulty: 'Difficult',
        question: `In standard Multi-Head Attention with sequence length N = ${N}, H = ${h} heads, and d_k = ${dk}, how many floating point operations (FLOPs, 2 ops per MAC) are required to compute QK^T?`,
        options: {
          A: `~${flopsG} GFLOPs`,
          B: `~${d1} GFLOPs`,
          C: `~${d2} GFLOPs`,
          D: `~${d3} GFLOPs`
        },
        answer: 'A',
        explanation: `QK^T computes H * N^2 dot products of dimension d_k. At 2 FLOPs per multiply-accumulate: 2 * ${h} * (${N}^2) * ${dk} = ~${flopsG} GFLOPs.`
      };
    },

    // 4. Effective Receptive Field of Stride-2 Conv
    (seed: number): AIMLQuestion => {
      const kSizes = [3, 5];
      const depths = [3, 4, 5];
      const k = kSizes[seed % kSizes.length];
      const d = depths[(seed >> 2) % depths.length];
      let rf = 1;
      let stride = 1;
      for (let i = 0; i < d; i++) {
        rf += (k - 1) * stride;
        stride *= 2;
      }

      const qId = `proc_rf_${k}_${d}`;
      return {
        id: qId,
        topic: 'Convolutional Architectures',
        difficulty: 'Difficult',
        question: `A CNN has ${d} stacked convolutional layers with kernel size K = ${k} and stride S = 2 at every layer. What is the effective 1D receptive field of a neuron in the final layer?`,
        options: {
          A: `${rf} pixels`,
          B: `${rf + (k * 2)} pixels`,
          C: `${rf - (k - 1)} pixels`,
          D: `${rf * 2} pixels`
        },
        answer: 'A',
        explanation: `Using the RF recurrence RF_l = RF_{l-1} + (K - 1) * Stride_{cumulative}, after ${d} layers with kernel ${k} and stride 2, the receptive field is exactly ${rf} pixels.`
      };
    },

    // 5. Distributed Gradient Accumulation
    (seed: number): AIMLQuestion => {
      const gpus = [4, 8, 16];
      const microBatch = [2, 4, 8];
      const accumSteps = [4, 8, 16];
      const g = gpus[seed % gpus.length];
      const m = microBatch[(seed >> 2) % microBatch.length];
      const a = accumSteps[(seed >> 4) % accumSteps.length];
      const effective = g * m * a;

      const qId = `proc_batch_${g}_${m}_${a}`;
      return {
        id: qId,
        topic: 'Distributed Training Systems',
        difficulty: 'Advanced',
        question: `In distributed training across ${g} GPUs, each worker uses a micro-batch size of ${m} and accumulates gradients for ${a} forward/backward steps before an optimizer step. What is the effective global batch size?`,
        options: {
          A: `${effective} samples`,
          B: `${effective / 2} samples`,
          C: `${effective * 2} samples`,
          D: `${g * m} samples`
        },
        answer: 'A',
        explanation: `Global batch size = GPUs (${g}) * Micro-batch (${m}) * Accumulation steps (${a}) = ${effective} samples.`
      };
    }
  ];

  public static shuffleOptions(question: AIMLQuestion): AIMLQuestion {
    const original = [
      { key: 'A', text: question.options.A, isCorrect: question.answer === 'A' },
      { key: 'B', text: question.options.B, isCorrect: question.answer === 'B' },
      { key: 'C', text: question.options.C, isCorrect: question.answer === 'C' },
      { key: 'D', text: question.options.D, isCorrect: question.answer === 'D' },
    ];

    for (let i = original.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [original[i], original[j]] = [original[j], original[i]];
    }

    const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    const newOptions: { A: string; B: string; C: string; D: string } = { A: '', B: '', C: '', D: '' };
    let newAnswer: 'A' | 'B' | 'C' | 'D' = 'A';

    original.forEach((opt, idx) => {
      const k = keys[idx];
      newOptions[k] = opt.text;
      if (opt.isCorrect) newAnswer = k;
    });

    return {
      id: question.id,
      topic: question.topic,
      difficulty: question.difficulty,
      question: question.question,
      options: newOptions,
      answer: newAnswer,
      explanation: question.explanation,
      fingerprint: `${question.topic}::${question.question.slice(0, 40)}`
    };
  }

  public static validateQuestion(q: AIMLQuestion): boolean {
    if (!q || !q.id || !q.question || !q.options) return false;
    const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    for (const k of keys) {
      if (!q.options[k] || typeof q.options[k] !== 'string' || q.options[k].trim().length === 0) {
        return false;
      }
    }
    if (!['A', 'B', 'C', 'D'].includes(q.answer)) return false;
    const set = new Set(Object.values(q.options));
    if (set.size !== 4) return false;
    return true;
  }

  /**
   * Intelligently selects questions following target distribution:
   * Easy: ~20%
   * Medium: ~35%
   * Difficult: ~30%
   * Advanced: ~15%
   */
  public static getNextQuestion(usedIds: string[] = []): AIMLQuestion {
    // 1. Target difficulty roll based on weighted distribution
    const roll = Math.random();
    let targetDifficulty: QuestionDifficulty = 'Medium';
    if (roll < 0.20) {
      targetDifficulty = 'Easy';
    } else if (roll < 0.55) {
      targetDifficulty = 'Medium';
    } else if (roll < 0.85) {
      targetDifficulty = 'Difficult';
    } else {
      targetDifficulty = 'Advanced';
    }

    // Try target difficulty first
    const tierUnused = this.CURATED_QUESTIONS.filter(
      q => q.difficulty === targetDifficulty && !usedIds.includes(q.id)
    );
    if (tierUnused.length > 0) {
      const pick = tierUnused[Math.floor(Math.random() * tierUnused.length)];
      return this.shuffleOptions(pick);
    }

    // Fallback: any unused curated question
    const anyUnused = this.CURATED_QUESTIONS.filter(q => !usedIds.includes(q.id));
    if (anyUnused.length > 0) {
      const pick = anyUnused[Math.floor(Math.random() * anyUnused.length)];
      return this.shuffleOptions(pick);
    }

    // Fallback: procedural generator
    let attempts = 0;
    while (attempts < 50) {
      const seed = Math.floor(Math.random() * 10000) + attempts;
      const genIndex = (attempts + seed) % this.PROCEDURAL_GENERATORS.length;
      const generator = this.PROCEDURAL_GENERATORS[genIndex];
      const q = generator(seed);
      if (!usedIds.includes(q.id) && this.validateQuestion(q)) {
        return this.shuffleOptions(q);
      }
      attempts++;
    }

    // Ultimate fallback: timestamp-cycled unique clone
    const base = this.CURATED_QUESTIONS[Math.floor(Math.random() * this.CURATED_QUESTIONS.length)];
    return this.shuffleOptions({ ...base, id: `${base.id}_cycle_${Date.now()}` });
  }

  public static getQuestion(usedIds: string[] = []): AIMLQuestion {
    return this.getNextQuestion(usedIds);
  }

  /**
   * Simulates AI answering with timing and accuracy mapped to difficulty
   */
  public static simulateAIAnswer(
    question: AIMLQuestion,
    difficulty: 'easy' | 'medium' | 'hard' | 'impossible'
  ): { option: 'A' | 'B' | 'C' | 'D'; delayMs: number } {
    let accuracy = 0.55;
    let minDelay = 4500;
    let maxDelay = 9500;

    switch (difficulty) {
      case 'easy':
        accuracy = 0.35;
        minDelay = 7000;
        maxDelay = 14000;
        break;
      case 'medium':
        accuracy = 0.60;
        minDelay = 5000;
        maxDelay = 10000;
        break;
      case 'hard':
        accuracy = 0.82;
        minDelay = 3500;
        maxDelay = 7000;
        break;
      case 'impossible':
      default:
        accuracy = 0.94;
        minDelay = 2200;
        maxDelay = 5000;
        break;
    }

    // Scale accuracy slightly by question difficulty
    if (question.difficulty === 'Easy') accuracy = Math.min(0.98, accuracy + 0.15);
    else if (question.difficulty === 'Advanced') accuracy = Math.max(0.20, accuracy - 0.10);

    const isCorrect = Math.random() < accuracy;
    let chosenOption: 'A' | 'B' | 'C' | 'D';

    if (isCorrect) {
      chosenOption = question.answer;
    } else {
      const wrong = (['A', 'B', 'C', 'D'] as Array<'A' | 'B' | 'C' | 'D'>).filter(k => k !== question.answer);
      chosenOption = wrong[Math.floor(Math.random() * wrong.length)];
    }

    const delayMs = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
    return { option: chosenOption, delayMs };
  }
}
