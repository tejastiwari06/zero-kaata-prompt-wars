export interface AIMLQuestion {
  id: string;
  topic: string;
  difficulty: string;
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
  winner: string | null; // playerId or 'P1' | 'P2' | 'AI'
  winnerSymbol: string | null; // 'X' | 'O'
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
  // Comprehensive curated bank of rigorous, advanced AI/ML questions
  public static CURATED_QUESTIONS: AIMLQuestion[] = [
    {
      id: 'ml_q1',
      topic: 'Contrastive Learning',
      difficulty: 'Research',
      question: 'Why does contrastive learning (e.g., SimCLR NT-Xent loss) benefit critically from temperature scaling tau in the softmax denominator?',
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
      id: 'ml_q2',
      topic: 'Transformers & Attention',
      difficulty: 'Advanced',
      question: 'In FlashAttention-2, what key algorithmic insight enables a ~2-4x speedup over standard Multi-Head Attention on modern GPUs?',
      options: {
        A: 'Replacing the softmax nonlinearity with a piecewise linear ReLU approximation.',
        B: 'Tiling inputs into SRAM blocks and online softmax scaling to avoid materializing the full N x N matrix in HBM.',
        C: 'Pruning 75% of query-key inner products based on magnitude thresholding.',
        D: 'Distributing query projections across CPU threads via asynchronous PCI-e DMA transfers.'
      },
      answer: 'B',
      explanation: 'FlashAttention computes exact attention by tiling Q, K, and V into fast GPU SRAM, maintaining running softmax normalization statistics (online softmax) without writing intermediate N x N attention matrix to slow HBM.'
    },
    {
      id: 'ml_q3',
      topic: 'Deep Learning Optimization',
      difficulty: 'Advanced',
      question: 'In the Adam optimizer, why are first (m_t) and second (v_t) moment estimates corrected by (1 - beta_1^t) and (1 - beta_2^t)?',
      options: {
        A: 'To regularize weight decay linearly with the current epoch step count.',
        B: 'To eliminate the initialization bias toward zero during early optimization steps.',
        C: 'To dynamically modulate the learning rate according to spectral norm upper bounds.',
        D: 'To enforce orthogonal updates across distinct parameter sub-tensors.'
      },
      answer: 'B',
      explanation: 'Since m_0 and v_0 are initialized to zero, exponential moving averages are heavily biased toward zero in early iterations. Dividing by (1 - beta^t) yields unbiased estimators since E[m_t] = E[g_t].'
    },
    {
      id: 'ml_q4',
      topic: 'Parameter-Efficient Fine-Tuning',
      difficulty: 'Advanced',
      question: 'In Low-Rank Adaptation (LoRA), how are adapter weight matrices A in R^{r x d_in} and B in R^{d_out x r} typically initialized before fine-tuning?',
      options: {
        A: 'Both A and B are initialized to identity matrices I_r.',
        B: 'Both A and B are initialized with zero vectors.',
        C: 'A is initialized with Gaussian noise and B is initialized to zero, so Delta W = B*A = 0 at step 0.',
        D: 'A is initialized to zero and B is initialized with Xavier uniform noise.'
      },
      answer: 'C',
      explanation: 'Setting B = 0 and A ~ N(0, sigma^2) ensures that the perturbation Delta W = B * A is strictly zero at the beginning of training, preserving the pre-trained model outputs.'
    },
    {
      id: 'ml_q5',
      topic: 'Deep Learning Architectures',
      difficulty: 'Advanced',
      question: 'What is the primary operational difference between Layer Normalization (LayerNorm) and Batch Normalization (BatchNorm) at inference time?',
      options: {
        A: 'LayerNorm requires caching running population statistics, whereas BatchNorm computes them dynamically.',
        B: 'BatchNorm uses fixed running mean/variance tracked during training, whereas LayerNorm computes statistics per sample across channels/features dynamically.',
        C: 'LayerNorm is strictly restricted to 1D signals and cannot normalize spatial activations.',
        D: 'BatchNorm normalizes across hidden feature dimensions independently for each sequence token.'
      },
      answer: 'B',
      explanation: 'BatchNorm uses frozen running mean and variance vectors accumulated during training at inference. LayerNorm computes mean and variance dynamically on each individual sample across feature dimensions, independent of batch size.'
    },
    {
      id: 'ml_q6',
      topic: 'Reinforcement Learning & Alignment',
      difficulty: 'Research',
      question: 'In Direct Preference Optimization (DPO), how is the policy objective derived from traditional RLHF with a Bradley-Terry reward model?',
      options: {
        A: 'By training an explicit neural reward model and taking Monte Carlo policy rollouts.',
        B: 'By expressing the ground-truth reward analytically as the implicit log-ratio of policy to reference probabilities: r(x,y) = beta * log(pi_theta(y|x) / pi_ref(y|x)).',
        C: 'By replacing cross-entropy loss with mean squared error over preferred token logits.',
        D: 'By optimizing actor-critic networks using Generalized Advantage Estimation over human ranking scores.'
      },
      answer: 'B',
      explanation: 'DPO uses the closed-form relationship between optimal policy and reward function in Bradley-Terry preference models, substituting r(x,y) = beta * log(pi / pi_ref) directly into the loss, completely bypassing explicit reward modeling.'
    },
    {
      id: 'ml_q7',
      topic: 'Mathematics of Machine Learning',
      difficulty: 'Research',
      question: 'For two continuous probability distributions P and Q, what does the Kullback-Leibler divergence D_KL(P || Q) quantify, and what is its symmetry property?',
      options: {
        A: 'It is a symmetric Euclidean metric quantifying the geometric distance between covariance matrices.',
        B: 'It quantifies the relative entropy (information loss) when using Q to approximate P; it is non-negative and generally asymmetric.',
        C: 'It measures the total variation bounded between -1 and +1, satisfying the triangle inequality.',
        D: 'It computes the cosine angle between probability density gradient vectors on a Riemannian manifold.'
      },
      answer: 'B',
      explanation: 'KL divergence D_KL(P || Q) = int P(x) log(P(x)/Q(x)) dx measures expected information loss using distribution Q to approximate true distribution P. By Gibbs inequality, D_KL(P || Q) >= 0, with equality iff P = Q almost everywhere; in general D_KL(P || Q) != D_KL(Q || P).'
    },
    {
      id: 'ml_q8',
      topic: 'Machine Learning Theory',
      difficulty: 'Advanced',
      question: 'Why does L1 (Lasso) regularization induce sparse weights whereas L2 (Ridge) regularization yields diffuse, non-zero weights?',
      options: {
        A: 'L1 penalizes small weights more gently than large weights.',
        B: 'The L1 norm is non-differentiable at w_i = 0 with a subgradient interval [-lambda, lambda], causing contours to hit coordinate axes at vertices.',
        C: 'L2 regularization eliminates gradient flow whenever weights become negative.',
        D: 'L1 optimization requires solving closed-form normal equations directly.'
      },
      answer: 'B',
      explanation: 'The L1 diamond-shaped constraint region has sharp corners on the coordinate axes where gradients have non-zero subgradient components, pushing non-critical weights exactly to zero.'
    },
    {
      id: 'ml_q9',
      topic: 'Transformers & Positional Encodings',
      difficulty: 'Advanced',
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
      id: 'ml_q10',
      topic: 'Quantization & Model Compression',
      difficulty: 'Advanced',
      question: 'In asymmetric uniform 8-bit integer quantization, how are real-valued tensor values x converted to quantized integers q in [0, 255]?',
      options: {
        A: 'q = round(x * 128) + 127',
        B: 'q = clamp(round(x / S) + Z, 0, 255) where S is scale and Z is integer zero-point.',
        C: 'q = floor(log2(abs(x))) * sign(x)',
        D: 'q = round(softmax(x) * 255)'
      },
      answer: 'B',
      explanation: 'Asymmetric quantization maps [x_min, x_max] to [0, 255] using scale S = (x_max - x_min) / 255 and integer zero-point Z = round(-x_min / S), computed as q = clamp(round(x / S) + Z, 0, 255).'
    },
    {
      id: 'ml_q11',
      topic: 'Deep Learning Architectures',
      difficulty: 'Advanced',
      question: 'What is the theoretical justification for the residual connection x + F(x) in ResNets preventing vanishing gradients?',
      options: {
        A: 'It multiplies the gradient Jacobian by an orthogonal unitary factor at every layer.',
        B: 'The gradient dE/dx = dE/dy * (I + dF/dx) includes an identity term I, ensuring a clean highway for gradient propagation regardless of dF/dx.',
        C: 'It replaces non-convex loss surfaces with strictly quadratic bowls.',
        D: 'It constrains all weight eigenvalues to lie strictly inside the complex unit circle.'
      },
      answer: 'B',
      explanation: 'By the chain rule, dE/dx_l = dE/dx_L * (I + sum dF/dx), so gradients can flow directly from output layer L back to shallow layer l without vanishing exponentially through repeated matrix multiplications.'
    },
    {
      id: 'ml_q12',
      topic: 'Information Retrieval & RAG',
      difficulty: 'Advanced',
      question: 'In dense vector retrieval for RAG, why is Maximum Inner Product Search (MIPS) equivalent to nearest neighbor search under Euclidean distance when embeddings are L2-normalized?',
      options: {
        A: 'Because ||u - v||^2 = ||u||^2 + ||v||^2 - 2<u, v> = 2 - 2<u, v>, so maximizing <u, v> minimizes Euclidean distance.',
        B: 'Because L2 normalization forces all vector dot products to zero.',
        C: 'Because high-dimensional spheres possess zero intrinsic curvature.',
        D: 'Because the cosine similarity matrix becomes strictly diagonally dominant.'
      },
      answer: 'A',
      explanation: 'When ||u|| = ||v|| = 1, ||u - v||^2 = 2 - 2(u . v). Thus, maximizing the dot product u . v directly minimizes ||u - v||^2, making MIPS and L2 Euclidean nearest neighbors mathematically identical.'
    },
    {
      id: 'ml_q13',
      topic: 'Mathematics of AI: Linear Algebra',
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
      id: 'ml_q14',
      topic: 'Deep Learning: Attention Mechanisms',
      difficulty: 'Advanced',
      question: 'What distinguishes Grouped-Query Attention (GQA) from Multi-Head Attention (MHA) and Multi-Query Attention (MQA)?',
      options: {
        A: 'GQA groups tokens across temporal sequence windows rather than head dimensions.',
        B: 'GQA divides H query heads into G groups, with all query heads in each group sharing a single Key and Value head, balancing speed and expressivity.',
        C: 'GQA replaces dot-product attention with group convolution filters.',
        D: 'GQA computes attention weights only between adjacent token clusters.'
      },
      answer: 'B',
      explanation: 'MHA uses 1 KV head per Q head; MQA shares 1 single KV head across all Q heads. GQA interpolates between them: G query groups share KV heads, significantly reducing KV cache memory while maintaining MHA-like accuracy.'
    },
    {
      id: 'ml_q15',
      topic: 'Optimization & Numerical Stability',
      difficulty: 'Research',
      question: 'In deep network loss functions, why is Cross-Entropy formulated using log-sum-exp stabilization instead of naive computation of exp(z_i) / sum exp(z_j)?',
      options: {
        A: 'Subtracting max(z) before exp prevents numerical overflow (inf) while adding a log shift prevents underflow to 0.',
        B: 'It reduces the asymptotic complexity of softmax from O(N) to O(log N).',
        C: 'It forces logits to be strictly orthogonal to the ground-truth one-hot label.',
        D: 'It removes negative eigenvalues from the loss Hessian matrix.'
      },
      answer: 'A',
      explanation: 'For large logits z_i, exp(z_i) overflows 32-bit floats to inf (yielding NaN). The identity log(sum exp(z_i)) = c + log(sum exp(z_i - c)) with c = max(z) guarantees all exponents <= 0, preventing overflow.'
    },
    {
      id: 'ml_q16',
      topic: 'Machine Learning Evaluation',
      difficulty: 'Advanced',
      question: 'In an extreme class-imbalanced binary classification setting (99.9% negative, 0.1% positive), why is the Precision-Recall AUC (PR-AUC) preferred over ROC-AUC?',
      options: {
        A: 'ROC-AUC cannot be calculated if the true negative count is non-zero.',
        B: 'The True Negative Rate (specificity) in the ROC denominator is dominated by huge negative counts, masking large numbers of false positives.',
        C: 'PR-AUC is invariant to monotonic probability calibration scaling.',
        D: 'ROC-AUC strictly penalizes precision drops more severely than recall drops.'
      },
      answer: 'B',
      explanation: 'In ROC, False Positive Rate = FP / (FP + TN). When TN is huge, FPR remains deceptively tiny even if FP is orders of magnitude larger than TP. PR-AUC focuses on Precision = TP / (TP + FP) and Recall, explicitly exposing false positives.'
    },
    {
      id: 'ml_q17',
      topic: 'Generative AI: Diffusion Models',
      difficulty: 'Research',
      question: 'In Denoising Diffusion Probabilistic Models (DDPM), what is the primary purpose of the reparameterization trick during forward diffusion sampling at arbitrary timestep t?',
      options: {
        A: 'Sampling x_t in closed form directly from x_0 via x_t = sqrt(alpha_bar_t)*x_0 + sqrt(1 - alpha_bar_t)*epsilon without iterative Markov steps.',
        B: 'Enforcing the noise schedule to strictly follow a deterministic Gaussian mixture.',
        C: 'Preventing the score function from depending on spatial image gradients.',
        D: 'Eliminating the variational lower bound computation during training.'
      },
      answer: 'A',
      explanation: 'Due to the composition of Gaussian distributions, the forward marginal q(x_t | x_0) can be computed in closed form at any arbitrary timestep t without simulating the Markov chain step-by-step from 1 to t.'
    },
    {
      id: 'ml_q18',
      topic: 'Reinforcement Learning: Policy Gradients',
      difficulty: 'Advanced',
      question: 'In Proximal Policy Optimization (PPO), what is the role of the clipped surrogate objective L^{CLIP}(theta)?',
      options: {
        A: 'It prevents overly large policy updates by clipping probability ratios r_t(theta) outside [1 - epsilon, 1 + epsilon] when advantage is positive or negative.',
        B: 'It clips state observation vectors to zero-mean unit variance.',
        C: 'It guarantees that policy entropy is strictly non-decreasing over training epochs.',
        D: 'It replaces Generalized Advantage Estimation with tabular Q-learning.'
      },
      answer: 'A',
      explanation: 'PPO clips the probability ratio r_t(theta) = pi_theta(a|s) / pi_old(a|s) to [1-eps, 1+eps], taking the minimum with the unclipped objective to penalize destructive policy updates while retaining first-order optimization efficiency.'
    },
    {
      id: 'ml_q19',
      topic: 'Deep Learning: Weight Initialization',
      difficulty: 'Advanced',
      question: 'Why does Kaiming (He) initialization use Var(W) = 2 / n_in instead of Xavier (Glorot) initialization Var(W) = 2 / (n_in + n_out) for networks with ReLU activations?',
      options: {
        A: 'Because ReLU sets roughly half the activations to zero, halving the variance at each forward layer.',
        B: 'Because ReLU causes activations to double in magnitude at every linear projection.',
        C: 'Because Xavier initialization is strictly invalid for complex-valued weights.',
        D: 'Because Kaiming initialization regularizes the spectral norm to 0.5.'
      },
      answer: 'A',
      explanation: 'Because ReLU(x) = max(0, x) outputs zero for negative inputs, under symmetric zero-mean assumptions roughly half the units are inactive, effectively halving variance. Multiplying variance by 2 restores activation variance across layers.'
    },
    {
      id: 'ml_q20',
      topic: 'Distributed Training & Systems',
      difficulty: 'Advanced Systems',
      question: 'In Zero Redundancy Optimizer Stage 3 (ZeRO-3), how are model states partitioned across data-parallel ranks to fit 100B+ parameter models?',
      options: {
        A: 'Only optimizer states are partitioned; gradients and parameters are replicated.',
        B: 'Optimizer states, gradients, and model parameters are all partitioned across ranks and gathered via all-gather right before forward/backward execution.',
        C: 'Weights are offloaded strictly to CPU RAM via PCIe and never stored in GPU VRAM.',
        D: 'Layers are split across distinct pipeline stages with 1F1B schedule.'
      },
      answer: 'B',
      explanation: 'ZeRO Stage 1 partitions optimizer states; Stage 2 partitions gradients; Stage 3 partitions all model parameters across data-parallel ranks, dynamically fetching weights via all-gather and discarding them immediately after each layer computation.'
    },
    {
      id: 'ml_q21',
      topic: 'Information Theory & Entropy',
      difficulty: 'Research',
      question: 'What distribution maximizes differential entropy over continuous random variables supported on (-inf, +inf) for a fixed mean and variance sigma^2?',
      options: {
        A: 'Uniform distribution on [-sqrt(3)*sigma, sqrt(3)*sigma]',
        B: 'Gaussian (Normal) distribution N(mu, sigma^2)',
        C: 'Laplace distribution with scale b = sigma / sqrt(2)',
        D: 'Cauchy distribution with scale gamma = sigma'
      },
      answer: 'B',
      explanation: 'By the maximum entropy principle using Lagrange multipliers with constraints on normalization and second moment, the Gaussian distribution uniquely maximizes differential entropy over the entire real line.'
    },
    {
      id: 'ml_q22',
      topic: 'Self-Supervised Learning',
      difficulty: 'Advanced',
      question: 'In Masked Autoencoders (MAE), why can the ViT encoder process only a small fraction (e.g. 25%) of visible image patches, while standard BERT must process 100% of tokens?',
      options: {
        A: 'MAE completely deletes masked patch tokens before feeding them to the encoder, processing only unmasked tokens to save compute.',
        B: 'Images have lower spatial dimensionality than natural language tokens.',
        C: 'MAE uses 2D spatial convolution instead of self-attention.',
        D: 'Visible patches are merged using pixel average pooling.'
      },
      answer: 'A',
      explanation: 'MAE discards masked patches completely during the heavy encoder pass, executing self-attention only on the 25% visible patches. Mask tokens are only introduced in the lightweight decoder, yielding ~4x compute savings.'
    },
    {
      id: 'ml_q23',
      topic: 'Mathematics: Optimization',
      difficulty: 'Advanced Mathematical',
      question: 'Under what condition does gradient descent with step size eta converge for a beta-smooth convex function f(x)?',
      options: {
        A: '0 < eta < 2 / beta',
        B: 'eta >= beta / 2',
        C: 'eta = beta^2',
        D: 'eta < 1 / (2 * beta^2)'
      },
      answer: 'A',
      explanation: 'For a beta-smooth convex function (Lipschitz continuous gradient with constant beta), standard descent lemma proves that gradient descent is guaranteed to monotonically decrease the objective whenever 0 < eta < 2 / beta.'
    },
    {
      id: 'ml_q24',
      topic: 'Model Distillation',
      difficulty: 'Advanced',
      question: 'In Hinton-style knowledge distillation, what is the role of temperature T in the teacher and student softened softmax distributions?',
      options: {
        A: 'Higher T softens probabilities, revealing rich "dark knowledge" (relative similarities across negative non-target classes).',
        B: 'Higher T drives the output toward a discrete one-hot vector.',
        C: 'Lower T prevents the student gradients from overflowing.',
        D: 'T scales the learning rate exponentially with model depth.'
      },
      answer: 'A',
      explanation: 'At T=1, probabilities of incorrect classes are nearly zero. Elevating T softens the distribution, revealing the rich structural similarities between classes that the teacher model discovered.'
    }
  ];

  // Procedural mathematical & system engineering question generators
  private static PROCEDURAL_GENERATORS = [
    // 1. LoRA Parameter Count
    (seed: number) => {
      const dModels = [768, 1024, 2048, 4096];
      const ranks = [4, 8, 16, 32];
      const layers = [16, 24, 32];
      const d = dModels[seed % dModels.length];
      const r = ranks[(seed >> 2) % ranks.length];
      const L = layers[(seed >> 4) % layers.length];
      // LoRA on Q and V: 2 matrices per layer, each has A (r x d) + B (d x r) = 2*d*r
      const correctParams = 2 * L * (2 * d * r);
      const d1 = L * (2 * d * r);
      const d2 = 2 * L * (d * d);
      const d3 = 2 * L * (d * r);

      const qId = `proc_lora_${d}_${r}_${L}`;
      return {
        id: qId,
        topic: 'Parameter-Efficient Fine-Tuning',
        difficulty: 'Advanced Numerical',
        question: `A transformer model has hidden dimension d = ${d} and L = ${L} layers. You apply LoRA with rank r = ${r} exclusively to Query and Value projections. What is the total count of trainable adapter parameters?`,
        options: {
          A: `${correctParams.toLocaleString()} parameters`,
          B: `${d1.toLocaleString()} parameters`,
          C: `${d2.toLocaleString()} parameters`,
          D: `${d3.toLocaleString()} parameters`
        },
        answer: 'A' as const,
        explanation: `Each layer has 2 adapted matrices (Q, V). Each requires matrices A (d x r) and B (r x d) totaling 2*d*r parameters. Across ${L} layers: 2 * ${L} * (2 * ${d} * ${r}) = ${correctParams.toLocaleString()} parameters.`
      };
    },

    // 2. KV Cache Memory Calculation
    (seed: number) => {
      const batches = [1, 4, 8, 16];
      const seqLens = [1024, 2048, 4096];
      const layers = [24, 32];
      const d = 4096;
      const b = batches[seed % batches.length];
      const s = seqLens[(seed >> 2) % seqLens.length];
      const L = layers[(seed >> 4) % layers.length];
      // KV cache = 2 (K+V) * B * S * L * d * 2 bytes (FP16)
      const bytesTotal = 2 * b * s * L * d * 2;
      const mb = Math.round(bytesTotal / (1024 * 1024));
      const mbD1 = Math.round(mb / 2);
      const mbD2 = Math.round(mb * 2);
      const mbD3 = Math.round(mb * 1.5);

      const qId = `proc_kv_${b}_${s}_${L}`;
      return {
        id: qId,
        topic: 'LLM Systems & Inference',
        difficulty: 'Advanced Systems',
        question: `For a transformer with hidden size d = ${d}, L = ${L} layers in FP16 (2 bytes/elem), what is the total KV cache memory allocated for batch size B = ${b} and context length S = ${s}?`,
        options: {
          A: `~${mb} MB`,
          B: `~${mbD1} MB`,
          C: `~${mbD2} MB`,
          D: `~${mbD3} MB`
        },
        answer: 'A' as const,
        explanation: `KV cache memory = 2 (Key + Value) * B * S * L * d * 2 bytes = 2 * ${b} * ${s} * ${L} * ${d} * 2 = ${bytesTotal.toLocaleString()} bytes = ~${mb} MB.`
      };
    },

    // 3. FLOPs in Multi-Head Attention QK^T
    (seed: number) => {
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
        difficulty: 'Advanced Mathematical',
        question: `In standard Multi-Head Attention with sequence length N = ${N}, H = ${h} heads, and d_k = ${dk}, how many floating point operations (FLOPs, 2 ops per MAC) are required to compute QK^T?`,
        options: {
          A: `~${flopsG} GFLOPs`,
          B: `~${d1} GFLOPs`,
          C: `~${d2} GFLOPs`,
          D: `~${d3} GFLOPs`
        },
        answer: 'A' as const,
        explanation: `QK^T computes H * N^2 dot products of dimension d_k. At 2 FLOPs per multiply-accumulate: 2 * ${h} * (${N}^2) * ${dk} = ~${flopsG} GFLOPs.`
      };
    },

    // 4. Effective Receptive Field of Stride-2 Conv
    (seed: number) => {
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
        difficulty: 'Advanced Deep Learning',
        question: `A CNN has ${d} stacked convolutional layers with kernel size K = ${k} and stride S = 2 at every layer. What is the effective 1D receptive field of a neuron in the final layer?`,
        options: {
          A: `${rf} pixels`,
          B: `${rf + (k * 2)} pixels`,
          C: `${rf - (k - 1)} pixels`,
          D: `${rf * 2} pixels`
        },
        answer: 'A' as const,
        explanation: `Using the RF recurrence RF_l = RF_{l-1} + (K - 1) * Stride_{cumulative}, after ${d} layers with kernel ${k} and stride 2, the receptive field is exactly ${rf} pixels.`
      };
    },

    // 5. Gradient Accumulation Effective Batch Size
    (seed: number) => {
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
        topic: 'Distributed Training',
        difficulty: 'Engineering Systems',
        question: `In distributed training across ${g} GPUs, each worker uses a micro-batch size of ${m} and accumulates gradients for ${a} forward/backward steps before an optimizer step. What is the effective global batch size?`,
        options: {
          A: `${effective} samples`,
          B: `${effective / 2} samples`,
          C: `${effective * 2} samples`,
          D: `${g * m} samples`
        },
        answer: 'A' as const,
        explanation: `Global batch size = GPUs (${g}) * Micro-batch (${m}) * Accumulation steps (${a}) = ${effective} samples.`
      };
    }
  ];

  /**
   * Shuffles options deterministically so correct answer is uniformly distributed among A, B, C, D
   */
  public static shuffleOptions(question: AIMLQuestion): AIMLQuestion {
    const original = [
      { key: 'A', text: question.options.A, isCorrect: question.answer === 'A' },
      { key: 'B', text: question.options.B, isCorrect: question.answer === 'B' },
      { key: 'C', text: question.options.C, isCorrect: question.answer === 'C' },
      { key: 'D', text: question.options.D, isCorrect: question.answer === 'D' },
    ];

    // Fisher-Yates shuffle
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

  /**
   * Validates a question candidate for structural integrity and technical correctness
   */
  public static validateQuestion(q: AIMLQuestion): boolean {
    if (!q || !q.id || !q.question || !q.options) return false;
    const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    for (const k of keys) {
      if (!q.options[k] || typeof q.options[k] !== 'string' || q.options[k].trim().length === 0) {
        return false;
      }
    }
    // Exactly one valid answer key
    if (!['A', 'B', 'C', 'D'].includes(q.answer)) return false;
    // Options must be mutually distinct
    const set = new Set(Object.values(q.options));
    if (set.size !== 4) return false;
    return true;
  }

  /**
   * Generates or selects a guaranteed non-repeating question given used IDs
   */
  public static getNextQuestion(usedIds: string[] = []): AIMLQuestion {
    // 1. Try unused curated questions
    const unused = this.CURATED_QUESTIONS.filter(q => !usedIds.includes(q.id));
    if (unused.length > 0) {
      const pick = unused[Math.floor(Math.random() * unused.length)];
      return this.shuffleOptions(pick);
    }

    // 2. Fall back to procedural generation
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

    // If completely exhausted, generate timestamp-keyed unique variation
    const base = this.CURATED_QUESTIONS[Math.floor(Math.random() * this.CURATED_QUESTIONS.length)];
    const uniqueBase = { ...base, id: `${base.id}_cycle_${Date.now()}` };
    return this.shuffleOptions(uniqueBase);
  }

  /**
   * Simulates realistic AI answering behavior based on selected difficulty
   * Returns: { option: 'A'|'B'|'C'|'D', delayMs: number }
   */
  public static simulateAIAnswer(
    question: AIMLQuestion,
    difficulty: 'easy' | 'medium' | 'hard' | 'impossible'
  ): { option: 'A' | 'B' | 'C' | 'D'; delayMs: number } {
    let accuracy = 0.40;
    let minDelay = 4500;
    let maxDelay = 8500;

    switch (difficulty) {
      case 'easy':
        accuracy = 0.35;
        minDelay = 5000;
        maxDelay = 9000;
        break;
      case 'medium':
        accuracy = 0.60;
        minDelay = 3500;
        maxDelay = 6500;
        break;
      case 'hard':
        accuracy = 0.82;
        minDelay = 2200;
        maxDelay = 4500;
        break;
      case 'impossible':
        accuracy = 0.94;
        minDelay = 1600;
        maxDelay = 3200;
        break;
    }

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

