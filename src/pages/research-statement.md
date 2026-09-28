---
layout: ../layouts/Page.astro
title: Research Statement
heading: "Research Statement: Active Generative Agents Lab"
---

Intelligent biological agents act to understand the world, not merely react to it. In contrast, modern artificial systems largely remain passive learners that struggle with efficiency, robustness, and reliability in open-ended settings. Recent progress in large-scale generative models and reinforcement learning makes it possible to revisit this gap with new tools, yet a principled integration remains missing. The Active Generative Agents Lab at the UNIST Graduate School of AI develops a unified framework in which generative modeling and reinforcement learning jointly enable agents to act, explore, and learn in the real world.

<div class="figure-row">
  <img src="/images/site/research-overview-1.jpg" alt="Diffusion models and energy-based models trained jointly with rewards" />
  <img src="/images/site/research-overview-2.jpg" alt="Robot arms performing an assembly task" />
</div>

We address the following algorithmic challenges.

### Unifying Generative Modeling and Reinforcement Learning

Generative modeling and reinforcement learning admit a common formulation under probabilistic learning over trajectories. This perspective enables new algorithmic designs that combine likelihood-based training with reward optimization, improving stability and credit assignment. We develop principled methods across energy-based models, diffusion models in continuous and discrete domains, and autoregressive models.

### Adaptive Generative Simulation

Generative models can act as adaptive, agent-conditioned simulators rather than static data generators. We construct closed-loop simulation frameworks in which the data distribution evolves in response to the agent’s uncertainty, performance, and objectives. The agent is trained along an automatically generated curriculum that consists of targeted, information-rich experiences.

### Information Gathering under Partial Observability

Classical approaches to decision-making under uncertainty, such as Bayesian optimization and multi-armed bandits, provide theoretically optimal strategies but do not scale to the high-dimensional, structured settings encountered by modern foundation models. Our goal is to equip parametric policies, including pretrained foundation models, with the ability to perform active and efficient exploration in such environments. We revisit reinforcement learning and imitation learning from this perspective, focusing on how exploration strategies can be learned rather than analytically derived. By leveraging simulated tasks and structured environments, we develop scalable methods that enable agents to acquire information effectively while maintaining computational and practical feasibility.

We apply these algorithmic advances to the following applications.

### Actively Exploring Agents

Agents must actively gather information to solve long-horizon, multi-step tasks. Current systems fail because they lack principled exploration and cannot identify or acquire the information needed for progress. We develop agents that formulate hypotheses, select informative actions, and iteratively update their strategies based on feedback and target domains such as software engineering, automated research, scientific discovery, and robotics, where success depends on sustained reasoning and interaction over time.

### Knowledge Distillation as Imitation Learning

Knowledge distillation is no black magic but imitation learning. The dominant approaches can be understood as variants of behavioral cloning, where a student model learns to reproduce the outputs of a stronger teacher. We focus on more challenging and practically relevant asymmetric settings, where the teacher and student differ in action space, architecture, or operational constraints, making naive behavioral cloning ineffective. Our work develops principled methods that extend beyond direct imitation, incorporating reinforcement learning and generative modeling to bridge these mismatches. Strengthening small models is critical for cost efficiency, edge deployment, and sustainability, and we aim to enable compact models that retain high capability under realistic constraints.

### Post-training of Robotics Foundation Models

Robotics foundation models require post-training methods that incorporate interaction and feedback. We develop techniques that combine generative simulation with reinforcement learning to refine vision-language-action models beyond behavioral cloning. These methods improve adaptability and safety in real-world deployment by enabling policy updates under structured feedback. We evaluate outcomes through success rates in real-world tasks, robustness to environmental variation, and adherence to safety constraints.

---

If this sounds interesting to you, don't hesitate to reach out to our lab!
We are open to collaboration and hiring new members. See [Recruiting](/recruiting/).
