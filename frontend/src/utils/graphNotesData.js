/**
 * AI Learning Universe — Master Graph Notes & Terminology Knowledge Base
 * Contextual educational explanations in both Simple English and Hinglish (Hindi + English).
 * 100% locally evaluated with zero external AI API dependencies.
 */

export const GRAPH_TERMS = {
  'x-axis': {
    title: 'X-Axis (Horizontal Axis)',
    en: 'The horizontal line at the bottom of the graph. It typically represents the independent variable—the input value you control or observe.',
    hi: 'X-axis horizontal line hoti hai. Ye usually independent variable ko represent karti hai, yani jis input value ko hum change ya observe karte hain.',
    badge: 'Coordinate System',
  },
  'y-axis': {
    title: 'Y-Axis (Vertical Axis)',
    en: 'The vertical line on the left side of the graph. It represents the dependent variable—the output value that changes in response to X.',
    hi: 'Y-axis vertical line hoti hai. Ye dependent variable ko show karti hai, yani X ki value change hone par output kaise change hota hai.',
    badge: 'Coordinate System',
  },
  origin: {
    title: 'Origin (0, 0)',
    en: 'The central reference point (0, 0) where the X-axis and Y-axis intersect. All coordinate distances are measured relative to the origin.',
    hi: 'Graph ka center point (0, 0) origin hota hai. Yahin se X aur Y coordinates positive ya negative direction mein measure hote hain.',
    badge: 'Reference Point',
  },
  coordinates: {
    title: 'Coordinates (x, y)',
    en: 'An ordered pair (x, y) defining an exact physical location in 2D space: x units horizontally from the origin and y units vertically.',
    hi: 'Coordinates (x, y) ek ordered pair hota hai jo graph par exact position batata hai: X direction mein kitna chalna hai aur Y direction mein kitna.',
    badge: 'Geometry',
  },
  'independent-variable': {
    title: 'Independent Variable (Input)',
    en: 'The variable whose values are chosen independently or manipulated by the experimenter (usually plotted on the X-axis).',
    hi: 'Ye wo variable hai jisko hum freely control ya input karte hain. Iska effect output par dekha jata hai (jaise house size ya study hours).',
    badge: 'Variables',
  },
  'dependent-variable': {
    title: 'Dependent Variable (Output)',
    en: 'The variable whose value depends on and changes in response to the independent variable (usually plotted on the Y-axis).',
    hi: 'Ye wo variable hai jo independent variable par depend karta hai. Yani X badla toh Y par kya asar pada (jaise house price ya exam score).',
    badge: 'Variables',
  },
  slope: {
    title: 'Slope (m / Gradient)',
    en: 'The rate of steepness or change: Δy / Δx. Indicates how many units Y changes for every single 1-unit step forward in X.',
    hi: 'Slope batata hai ki X mein 1 unit change hone par Y kitni speed se change ho raha hai (steepness of the line). Formula: Δy / Δx.',
    badge: 'Linear Algebra',
  },
  intercept: {
    title: 'Intercept (c / Vertical Bias)',
    en: 'The point where the line crosses the Y-axis (where x = 0). In machine learning, this corresponds to the bias term b.',
    hi: 'Jahan line vertical Y-axis ko cross karti hai (jab X = 0 ho) use intercept ya bias kehte hain. Ye baseline starting value hoti hai.',
    badge: 'Linear Algebra',
  },
  'intersection-point': {
    title: 'Intersection Point',
    en: 'The exact coordinate where two lines, curves, or decision boundaries cross each other, meaning both equations yield the identical value.',
    hi: 'Jahan do lines ya curves ek dusre ko cross karti hain, us point ko intersection point kehte hain. Wahan dono equations equal hoti hain.',
    badge: 'Geometry',
  },
  'data-point': {
    title: 'Data Point (Observation / Sample)',
    en: 'A single measured sample or training example with feature coordinates in the feature space.',
    hi: 'Dataset ka ek single real-world record ya sample. Graph par ye ek dot ki tarah dikhta hai jiske apne feature coordinates hote hain.',
    badge: 'Data',
  },
  curve: {
    title: 'Curve (Non-linear Function)',
    en: 'A smooth continuous mathematical path whose slope changes dynamically at every point (e.g. parabolas, sigmoids, polynomials).',
    hi: 'Ek non-linear path jiska slope har point par change hota hai. Ye complex real-world patterns ko capture karne ke liye use hoti hai.',
    badge: 'Calculus',
  },
  gradient: {
    title: 'Gradient (Vector of Partial Derivatives)',
    en: 'The multidimensional direction and rate of steepest ascent of a loss function. Optimization algorithms travel opposite to the gradient (-∇L).',
    hi: 'Gradient ek vector hota hai jo batata hai ki function kis direction mein sabse tezi se badh raha hai. Gradient Descent iske ulte chalta hai.',
    badge: 'Optimization',
  },
  scale: {
    title: 'Scale & Aspect Ratio',
    en: 'The visual unit distance per pixel along each axis. Keeping scale proportional prevents geometric distortion in distance calculations.',
    hi: 'Har axis par ek unit kitne pixels ka hai use scale kehte hain. Agar scale galat ho toh distances aur shapes distort ho jate hain.',
    badge: 'Coordinate System',
  },
  range: {
    title: 'Range (Domain & Codomain Limits)',
    en: 'The span of minimum to maximum values displayed on an axis [min, max].',
    hi: 'Axis par minimum se maximum value ka span [min, max]. Ye decide karta hai ki graph par kitna area dikhai dega.',
    badge: 'Coordinate System',
  },
  'positive-negative': {
    title: 'Positive and Negative Values',
    en: 'Values to the right of / above the origin are positive (> 0); values to the left / below are negative (< 0).',
    hi: 'Origin ke right aur upar positive numbers hote hain; left aur neeche negative numbers hote hain. Zero reference divider hota hai.',
    badge: 'Geometry',
  },
  'maximum-minimum': {
    title: 'Maximum and Minimum (Extrema)',
    en: 'Peaks where the derivative equals zero: local minimums represent the lowest loss values sought by optimizers.',
    hi: 'Graph ke sabse unche peaks (maximum) ya sabse neeche ke gaddhe (minimum). Machine Learning mein hum loss function ka minimum dhundhte hain.',
    badge: 'Optimization',
  },
  'decision-boundary': {
    title: 'Decision Boundary',
    en: 'A hypersurface separating different classification regions (e.g. class 0 vs class 1). Points on the boundary have equal probability.',
    hi: 'Ek aisi line ya surface jo alag-alag classes ko divide karti hai. Is line ke ek taraf Model Class A predict karta hai aur doosri taraf Class B.',
    badge: 'Classification',
  },
  centroid: {
    title: 'Centroid (Cluster Center of Mass)',
    en: 'The arithmetic mean position of all data points assigned to a cluster in K-Means.',
    hi: 'Kisi cluster ke sabhi points ka center point (average position). K-Means mein ye har iteration mein apne points ke center par move hota hai.',
    badge: 'Clustering',
  },
  'loss-curve': {
    title: 'Loss Curve (Objective Function Landscape)',
    en: 'A plot of training loss versus epochs or parameter steps, visually confirming whether model error decreases toward convergence.',
    hi: 'Training ke saath-saath model ki galti (loss) kaise kam ho rahi hai, ye plot loss curve kehlata hai. Ye neeche jana chahiye.',
    badge: 'Deep Learning',
  },
  'feature-map': {
    title: 'Feature Map (Activation Tensor)',
    en: 'The 2D output generated by convolving a learned kernel/filter across an image, highlighting edges, textures, or semantic parts.',
    hi: 'CNN mein jab filter image ke upar slide karta hai, toh jo output banta hai use feature map kehte hain. Ye edges aur patterns ko highlight karta hai.',
    badge: 'Deep Learning',
  },
};

/**
 * Contextual graph explanations catalog
 */
export const CONTEXTUAL_GRAPH_EXPLANATIONS = {
  // 1. Linear Regression
  'linear-regression': {
    title: 'Linear Regression Fit & Residuals',
    relevantTerms: ['x-axis', 'y-axis', 'slope', 'intercept', 'data-point', 'independent-variable', 'dependent-variable', 'range'],
    en: {
      plotted: 'A 2D scatter plot of training samples (xᵢ, yᵢ) overlaid with the Ordinary Least Squares (OLS) best-fit line: ŷ = mx + b.',
      xAxis: 'Feature variable X (independent input value, e.g. house area, experience, engine displacement).',
      yAxis: 'Target variable Y (dependent continuous output value, e.g. price, salary, fuel consumption).',
      pointsLines: 'Dots represent real training observations. The solid line represents the model\'s prediction ŷ. Red dashed vertical lines show residuals (prediction errors: y - ŷ).',
      shapeReason: 'Linear regression assumes a straight-line proportional relationship where every 1-unit increase in X changes Y by the slope m.',
      intersection: 'The line crosses the Y-axis at (0, b), which represents the baseline prediction when X is zero.',
      parameterEffects: 'Increasing the slope rotates the line steeper; changing intercept shifts the entire line vertically up or down.',
      coreTakeaway: 'The optimal regression line minimizes the sum of squared vertical residuals (MSE). Extreme outliers exert strong leverage on the line.',
      applications: 'Real estate pricing, demand forecasting, stock trend modeling, risk assessment, and scientific trend analysis.',
    },
    hi: {
      plotted: 'Training data points (x, y) aur unke beech se guzarne wali best-fit straight line: y = mx + b.',
      xAxis: 'Input Feature X (independent variable, jaise flat ka size ya employee ka experience).',
      yAxis: 'Output Target Y (dependent continuous variable, jaise flat ki price ya employee ki salary).',
      pointsLines: 'Dots real data samples hain. Solid blue line model ki prediction ŷ hai. Red dashed lines residuals (errors) show karti hain.',
      shapeReason: 'Ye straight line isliye hai kyunki Linear Regression assume karta hai ki X badhne se Y linearly ek fixed speed se badhega.',
      intersection: 'Line Y-axis ko (0, b) par intersect karti hai. Iska matlab jab X zero ho, tab base prediction kya hogi.',
      parameterEffects: 'Slope (m) badhane se line steep ho jati hai; intercept (b) badhane se poori line upar shift ho jati hai.',
      coreTakeaway: 'Best line wahi hoti hai jo saare points se total squared distance (MSE) ko sabse kam kare.',
      applications: 'House price prediction, sales forecasting, insurance risk scoring, aur trend estimation.',
    },
  },

  // 2. K-Means
  'kmeans': {
    title: 'K-Means Clustering & Voronoi Partitions',
    relevantTerms: ['x-axis', 'y-axis', 'centroid', 'data-point', 'coordinates', 'scale', 'distance'],
    en: {
      plotted: 'Unlabeled 2D observations grouped into K distinct clusters, showing centroid centers and Voronoi neighborhood boundaries.',
      xAxis: 'Feature 1 dimension in feature space.',
      yAxis: 'Feature 2 dimension in feature space.',
      pointsLines: 'Colored dots belong to their nearest centroid. Large crossed stars represent the cluster centroids μₖ.',
      shapeReason: 'Clusters form convex polygonal Voronoi cells because each point is assigned to its nearest Euclidean center.',
      intersection: 'Lines between clusters represent perpendicular bisectors where points are equidistant to two centroids.',
      parameterEffects: 'Changing K splits or merges clusters; moving centroids reshapes cluster boundaries immediately.',
      coreTakeaway: 'K-Means alternates between assigning points to closest centroids and updating centroids to the mean of their points until convergence.',
      applications: 'Customer segmentation, image compression/quantization, anomaly detection, document grouping.',
    },
    hi: {
      plotted: 'Unlabeled 2D data points ko K clusters mein divide kiya gaya hai, saath mein cluster centers (centroids) dikhaye gaye hain.',
      xAxis: 'Data ka pehla feature (Feature 1).',
      yAxis: 'Data ka doosra feature (Feature 2).',
      pointsLines: 'Dots training samples hain, jinka color unke assigned cluster ko batata hai. Bade stars cluster ke centroids hain.',
      shapeReason: 'Boundaries straight polygon jaisi isliye banti hain kyunki har point sabse nazdeek wale centroid se judta hai (Voronoi partition).',
      intersection: 'Clusters ke beech ki lines wo jagah hain jahan dono centroids ka distance barabar hota hai.',
      parameterEffects: 'K badhane se data zyada chote groups mein divide hota hai; centroids move hone par cluster boundaries change ho jati hain.',
      coreTakeaway: 'K-Means do steps repeat karta hai: pehle points ko closest centroid assign karna, fir centroid ko uske points ke center par move karna.',
      applications: 'Customer market segmentation, image color compression, recommendation systems, fraud detection.',
    },
  },

  // 3. KNN
  'knn': {
    title: 'K-Nearest Neighbors Decision Surface',
    relevantTerms: ['x-axis', 'y-axis', 'decision-boundary', 'data-point', 'coordinates', 'distance', 'scale'],
    en: {
      plotted: 'Multi-class training samples across a 2D feature grid, with colored background regions showing the majority voting decision surface.',
      xAxis: 'First input feature dimension (e.g. Petal Length).',
      yAxis: 'Second input feature dimension (e.g. Petal Width).',
      pointsLines: 'Colored dots are labeled training examples. The background shading shows the predicted class for any new test point placed there.',
      shapeReason: 'With small K (e.g. K=1), boundaries are complex and island-like; with larger K, voting smooths out the surface.',
      intersection: 'Boundaries where class vote ties occur (50/50 probability).',
      parameterEffects: 'Increasing K increases model bias and smooths boundaries; small K increases variance and risks overfitting noise.',
      coreTakeaway: 'KNN makes zero parametric assumptions: the decision boundary is computed purely from local training neighborhoods.',
      applications: 'Medical diagnosis, handwriting recognition, credit risk classification, visual search.',
    },
    hi: {
      plotted: '2D feature space mein labeled points aur unka background color jo dikhata hai ki naya point aane par kya prediction hogi.',
      xAxis: 'Input Feature 1 (jaise petal length ya age).',
      yAxis: 'Input Feature 2 (jaise petal width ya income).',
      pointsLines: 'Dots known labeled data hain. Background ka color batata hai ki us area mein majority vote kis class ka hai.',
      shapeReason: 'Agar K chota ho (jaise K=1) toh boundary tedhi-medhi jagged hoti hai. K bada karne par boundary smooth ho jati hai.',
      intersection: 'Do color regions ki boundary wahan hoti hai jahan dono classes ke neighbors barabar vote paate hain.',
      parameterEffects: 'K badhane se decision boundary smooth aur general banti hai; K chota rakhne par model noise par overfit ho sakta hai.',
      coreTakeaway: 'KNN koi formula memorize nahi karta, balki naye point ke sabse kareebi K neighbors ka majority vote lekar faisla karta hai.',
      applications: 'Disease prediction, handwriting digit recognition, customer classification.',
    },
  },

  // 4. Decision Tree
  'decision-tree': {
    title: 'Decision Tree Axis-Aligned Partitions',
    relevantTerms: ['x-axis', 'y-axis', 'decision-boundary', 'data-point', 'range', 'scale'],
    en: {
      plotted: 'Hierarchical axis-aligned rectangular partitions created by recursive feature threshold splits: xⱼ ≤ t.',
      xAxis: 'Feature X₁ axis.',
      yAxis: 'Feature X₂ axis.',
      pointsLines: 'Data points with class colors; rectangular grids show the decision rules formed by internal tree nodes.',
      shapeReason: 'Boundaries are strictly horizontal and vertical because single-feature decision trees test one feature at a time against a threshold.',
      intersection: 'Grid corners where horizontal (X₂ ≤ t₂) and vertical (X₁ ≤ t₁) split lines meet.',
      parameterEffects: 'Higher max_depth creates finer rectangular boxes; smaller min_samples_split allows isolated tiny leaf boxes.',
      coreTakeaway: 'Decision trees greedily choose the split that maximizes Information Gain (minimizes Gini Impurity or Entropy).',
      applications: 'Credit loan approval, customer churn prediction, medical diagnosis trees, fraud detection.',
    },
    hi: {
      plotted: 'Data space ko horizontal aur vertical lines se rectangular boxes mein divide kiya gaya decision tree model.',
      xAxis: 'Pehla Feature X₁.',
      yAxis: 'Doosra Feature X₂.',
      pointsLines: 'Colored dots classes hain. Straight horizontal aur vertical lines tree ke rules (if-else conditions) ko represent karti hain.',
      shapeReason: 'Ye lines hamesha 90-degree par hoti hain kyunki decision tree ek baar mein sirf ek feature par threshold test karta hai (x ≤ t).',
      intersection: 'Grid corners jahan multiple split conditions aapas mein milti hain.',
      parameterEffects: 'Depth badhane se tree zyada chote-chote boxes banata hai, jisse training data par accuracy badhti hai par overfit ka risk hota hai.',
      coreTakeaway: 'Tree har step par wo split chunta hai jisse data ki purity sabse zyada badhe (Gini impurity kam ho).',
      applications: 'Loan approval rules, patient diagnosis logic, banking fraud prevention.',
    },
  },

  // 5. Gradient Descent
  'gradient-descent': {
    title: 'Gradient Descent Loss Minimization',
    relevantTerms: ['x-axis', 'y-axis', 'gradient', 'slope', 'maximum-minimum', 'curve', 'loss-curve', 'range'],
    en: {
      plotted: 'A 1D/2D convex loss bowl L(w) with the optimizer ball taking steps opposite to the gradient toward the global minimum.',
      xAxis: 'Model weight parameter w.',
      yAxis: 'Loss / Error value L(w).',
      pointsLines: 'The curve represents the error landscape. The moving ball is the current parameter state; arrows indicate step vectors -η · ∇L.',
      shapeReason: 'Quadratic loss functions like MSE form a smooth U-shaped parabolic curve with a unique lowest point (minimum).',
      intersection: 'The lowest point (bottom of the bowl) where the slope/derivative equals zero (f\'(w) = 0).',
      parameterEffects: 'Higher learning rate η makes larger steps (risking overshoot); tiny η crawls very slowly toward the minimum.',
      coreTakeaway: 'Gradient descent iteratively updates parameters: w_new = w_old - η · (dL/dw) until the slope becomes nearly zero.',
      applications: 'Training neural networks, logistic regression, deep learning optimizers (Adam, RMSProp, SGD).',
    },
    hi: {
      plotted: 'Ek U-shape ka gaddha (Loss curve) jisme ball gradient ke ulte direction mein ludhak kar sabse neeche minimum point tak pahunchti hai.',
      xAxis: 'Model ka weight parameter w.',
      yAxis: 'Loss / Error L(w) yani model kitni galti kar raha hai.',
      pointsLines: 'Curve loss landscape hai. Moving ball current weight hai. Arrows steps dikhate hain (-learning_rate * gradient).',
      shapeReason: 'MSE loss formula square hone ki wajah se U-shaped curve banta hai jiska sabse neeche ek minimum point hota hai.',
      intersection: 'Sabse neeche ka point jahan slope (derivative) zero ho jata hai, yani minimum error.',
      parameterEffects: 'Learning rate (η) zyada bada ho toh ball gaddhe se bahar kud sakti hai (overshoot); bohot chota ho toh pahunchne mein bohot time lagta hai.',
      coreTakeaway: 'Model har step par derivative check karke dhalan ke ulte raste chal kar error ko minimize karta hai.',
      applications: 'Neural networks ki training, deep learning backpropagation, LLM weight updates.',
    },
  },

  // 6. Backpropagation
  'backpropagation': {
    title: 'Neural Network Backpropagation & Computational Graph',
    relevantTerms: ['gradient', 'loss-curve', 'slope', 'curve', 'dependent-variable', 'independent-variable'],
    en: {
      plotted: 'Multi-layer neural network architecture with forward signal activations and backward flowing gradient errors calculated via the chain rule.',
      xAxis: 'Forward signal direction from Input Layer to Hidden Layer to Output Layer.',
      yAxis: 'Neuron layers and activation values.',
      pointsLines: 'Nodes represent neurons (Σ sum and activation σ). Colored connection edges show learned weights and backward gradient flows.',
      shapeReason: 'Directed acyclic computational graph showing exact dependencies for chain-rule derivative calculations.',
      intersection: 'Neuron summation junctions where incoming inputs are multiplied by weights and accumulated.',
      parameterEffects: 'Altering learning rate adjusts the magnitude of weight delta: Δw = -η · (∂L/∂w).',
      coreTakeaway: 'Backpropagation applies the calculus chain rule backward from the loss to compute the exact sensitivity (gradient) of every weight in the network.',
      applications: 'Training all modern deep learning architectures: Transformers, CNNs, MLPs, LSTMs.',
    },
    hi: {
      plotted: 'Neural network ka architecture jisme aage signal jata hai (Forward pass) aur peeche error ke gradients aate hain (Backward pass).',
      xAxis: 'Left se right signal flow: Input -> Hidden -> Output.',
      yAxis: 'Different layers ke neurons.',
      pointsLines: 'Circles neurons hain. Lines weights hain jin par signals multiply hokar aage badhte hain aur backward pass mein gradients aate hain.',
      shapeReason: 'Ye computational graph hai jisse chain rule ka use karke har weight ka partial derivative calculate hota hai.',
      intersection: 'Summation node (Σ) jahan inputs aur weights multiply hokar add hote hain.',
      parameterEffects: 'Learning rate change karne se weights mein update hone wali value ka size change hota hai.',
      coreTakeaway: 'Backpropagation chain rule se pata lagata hai ki final loss mein kis weight ki kitni galti thi aur use kitna theek karna hai.',
      applications: 'Transformers, ChatGPT, computer vision models aur deep neural networks ko train karna.',
    },
  },

  // 7. General Custom Equation / Function Plot
  'custom-equation': {
    title: 'Custom Mathematical Equation Explorer',
    relevantTerms: ['x-axis', 'y-axis', 'origin', 'coordinates', 'slope', 'intercept', 'curve', 'range', 'scale', 'positive-negative', 'maximum-minimum'],
    en: {
      plotted: 'Custom mathematical functions y = f(x) evaluated continuously across the coordinate grid with customizable parameters and data points.',
      xAxis: 'Independent input variable x.',
      yAxis: 'Evaluated function output y = f(x).',
      pointsLines: 'Solid and dashed colored curves represent plotted mathematical equations; dots represent user-defined reference coordinates.',
      shapeReason: 'The shape is dictated purely by the mathematical operators (linear straight lines, quadratic parabolas, exponential curves, trigonometric waves).',
      intersection: 'Points where y = 0 (roots / x-intercepts) or where two custom equations cross.',
      parameterEffects: 'Adjusting coefficient variables (m, c, a, b) dynamically stretches, compresses, shifts, or inverts the curves.',
      coreTakeaway: 'Visualizing mathematical functions connects algebraic formulas with geometrical spatial intuition.',
      applications: 'Scientific simulations, machine learning activation modeling, physics dynamics, signal processing.',
    },
    hi: {
      plotted: 'User ki custom mathematical equation y = f(x) ka live graphical plot, saath mein customizable variables aur coordinates.',
      xAxis: 'Input variable x (horizontal axis).',
      yAxis: 'Output variable y = f(x) (vertical axis).',
      pointsLines: 'Lines aur curves mathematically calculated functions ko draw karti hain; dots custom reference points hain.',
      shapeReason: 'Shape formula par depend karta hai: x^2 se parabola banta hai, sin(x) se wave banti hai, aur mx+c se straight line banti hai.',
      intersection: 'Jahan curve axis ko ya kisi doosri equation ko cross karta hai.',
      parameterEffects: 'Sliders se constants (a, b, m, c) change karne par curve stretch, compress ya shift hota hai.',
      coreTakeaway: 'Formulas ko visually dekhne se algebra aur geometry ka connection aasani se samajh aata hai.',
      applications: 'Physics simulations, ML loss function modeling, activation functions, signal waveforms.',
    },
  },
};
