"""
Script to synthesize all roadmap topics, mathematics topics, and core concepts
into a unified, fully validated concepts.json database.
"""
from __future__ import annotations

import json
from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from models.concept import Concept

DATA_DIR = BACKEND_DIR / "data"

CATEGORY_COLORS = {
    "Foundations": "#06b6d4",
    "Mathematics": "#8b5cf6",
    "Data Science": "#10b981",
    "Core ML": "#3b82f6",
    "Algorithms": "#f59e0b",
    "Optimization": "#ef4444",
    "Deep Learning": "#ec4899",
    "Evaluation": "#f97316",
}

CATEGORY_ICONS = {
    "Foundations": "🏛️",
    "Mathematics": "📐",
    "Data Science": "📊",
    "Core ML": "🤖",
    "Algorithms": "🌳",
    "Optimization": "🔻",
    "Deep Learning": "🧠",
    "Evaluation": "🎯",
}

def map_cluster(domain: str, category: str, title: str) -> str:
    cat = (category or "").strip()
    if domain == "mathematics" or cat in [
        "algebra", "linear-algebra", "calculus", "statistics",
        "Mathematical Foundations", "Probability & Inference"
    ]:
        return "Mathematics"
    if cat in [
        "Foundations", "Data Fundamentals", "Programming Environment",
        "Core Libraries", "ML Fundamentals", "ML Foundations", "DL Foundations", "Data in ML"
    ]:
        return "Foundations"
    if domain == "data-science" or cat in [
        "Data Preparation", "Feature Pipelines", "Exploration & Visualization",
        "Visual Communication", "Descriptive Statistics", "Statistical Inference",
        "Correlation & Relationships", "Feature Engineering", "Feature Engineering & Selection", "Time Series"
    ]:
        return "Data Science"
    if cat in [
        "Learning Paradigms", "Linear Models", "Linear Classification",
        "Parametric Regression", "Regression Analysis", "Instance-Based Models",
        "Margin-Based Models", "Probabilistic Models"
    ]:
        return "Core ML"
    if cat in [
        "Tree-Based Models", "Ensemble Methods", "Clustering Algorithms",
        "Unsupervised Transformation", "Applied ML Projects", "Applied Projects"
    ]:
        return "Algorithms"
    if cat in [
        "Optimization Foundations", "Optimizers", "Loss Formulations",
        "Backpropagation & Gradients", "Model Optimization", "Generalization & Regularization", "Advanced Training"
    ]:
        return "Optimization"
    if domain == "deep-learning" or cat in [
        "Neuron Anatomy", "Signal Flow", "Non-Linearities", "Network Anatomy",
        "Computer Vision", "Advanced Vision", "Sequence Models", "Advanced Sequences",
        "Attention & Transformers", "Generative & Latent Models", "Representations",
        "Foundational Models", "Modern Paradigms", "Applied DL Projects", "Production DL"
    ]:
        return "Deep Learning"
    if cat in [
        "Model Evaluation", "Model Lifecycle", "Production ML", "MLOps",
        "Production Challenges", "Explainable AI (XAI)", "Advanced Modeling", "Advanced Inference", "Infrastructure"
    ]:
        return "Evaluation"
    return "Core ML"

def normalize_difficulty(diff: str) -> str:
    d = (diff or "intermediate").lower()
    if "begin" in d or "easy" in d or "basic" in d:
        return "Beginner"
    if "adv" in d or "hard" in d:
        return "Advanced"
    return "Intermediate"

def main():
    # 1. Load existing concepts
    existing_file = DATA_DIR / "concepts.json"
    with open(existing_file, "r", encoding="utf-8") as f:
        existing_concepts = json.load(f)

    concepts_by_id: dict[str, dict] = {}
    for c in existing_concepts:
        concepts_by_id[c["id"]] = c

    print(f"Loaded {len(existing_concepts)} existing concepts.")

    # 2. Load roadmaps
    roadmaps_file = DATA_DIR / "roadmaps.json"
    with open(roadmaps_file, "r", encoding="utf-8") as f:
        roadmaps_data = json.load(f)

    # Track sequence of topics per domain and level for nextConcepts linking
    roadmap_topics_list = []
    for domain_id, dom in roadmaps_data.items():
        levels = dom.get("levels", {})
        for lvl_id, topics in levels.items():
            for idx, topic in enumerate(topics):
                next_id = topics[idx + 1]["id"] if idx + 1 < len(topics) else None
                roadmap_topics_list.append((domain_id, lvl_id, topic, next_id))

    print(f"Loaded {len(roadmap_topics_list)} roadmap topics.")

    # 3. Load math topics
    math_file = DATA_DIR / "mathematics.json"
    with open(math_file, "r", encoding="utf-8") as f:
        math_data = json.load(f)
    math_topics = math_data.get("topics", [])
    print(f"Loaded {len(math_topics)} math topics.")

    # 4. Integrate roadmap topics into concepts
    added_from_roadmaps = 0
    for domain_id, lvl_id, topic, next_id in roadmap_topics_list:
        tid = topic["id"]
        cluster = map_cluster(domain_id, topic.get("category", ""), topic.get("title", ""))
        difficulty = normalize_difficulty(topic.get("difficulty", "intermediate"))
        icon = CATEGORY_ICONS.get(cluster, "💡")
        color = CATEGORY_COLORS.get(cluster, "#06b6d4")

        req_math = topic.get("requiredMathTopicIds", [])
        math_formulas = []
        if req_math:
            math_formulas.append(f"Prerequisite Math: {', '.join(req_math)}")

        math_explanation = topic.get("description", "")
        if req_math:
            math_explanation += f" Requires foundational mastery of {', '.join(req_math)}."

        objectives = topic.get("learningObjectives", [])
        beginner_exp = " ".join(objectives) if objectives else topic.get("description", "")

        viz_ids = topic.get("visualizationIds", [])
        viz_type = viz_ids[0] if viz_ids else ("neural-network" if cluster == "Deep Learning" else "cartesian")

        next_concepts = [next_id] if next_id else []

        if tid in concepts_by_id:
            # Augment existing concept
            c = concepts_by_id[tid]
            c.setdefault("domain", domain_id)
            c.setdefault("level", lvl_id)
            if not c.get("prerequisites") and topic.get("prerequisites"):
                c["prerequisites"] = topic["prerequisites"]
            if not c.get("nextConcepts") and next_concepts:
                c["nextConcepts"] = next_concepts
        else:
            concepts_by_id[tid] = {
                "id": tid,
                "title": topic.get("title", tid),
                "category": cluster,
                "difficulty": difficulty,
                "domain": domain_id,
                "level": lvl_id,
                "icon": icon,
                "color": color,
                "prerequisites": topic.get("prerequisites", []),
                "definition": topic.get("description", ""),
                "beginnerExplanation": beginner_exp,
                "example": f"Applied in real-world {topic.get('title', '')} scenarios.",
                "mathematics": {
                    "formulas": math_formulas,
                    "explanation": math_explanation,
                },
                "visualization": {
                    "type": viz_type,
                    "parameters": {},
                },
                "experiments": [],
                "breakIt": [],
                "challenges": [],
                "debugging": [],
                "relatedConcepts": topic.get("recommendedMathTopicIds", []),
                "nextConcepts": next_concepts,
            }
            added_from_roadmaps += 1

    print(f"Added {added_from_roadmaps} new concepts from roadmaps.")

    # 5. Integrate mathematics topics
    added_from_math = 0
    for m in math_topics:
        mid = m["id"]
        if mid not in concepts_by_id:
            difficulty = normalize_difficulty(m.get("difficulty", "intermediate"))
            concepts_by_id[mid] = {
                "id": mid,
                "title": m.get("title", mid),
                "category": "Mathematics",
                "difficulty": difficulty,
                "domain": "data-science",
                "level": m.get("level", "basic"),
                "icon": "📐",
                "color": "#8b5cf6",
                "prerequisites": m.get("prerequisites", []),
                "definition": m.get("description", ""),
                "beginnerExplanation": m.get("description", ""),
                "example": f"Applied in vector math, optimization gradients, and statistical analysis.",
                "mathematics": {
                    "formulas": [f"f(x) over {m.get('title', mid)}"],
                    "explanation": m.get("description", ""),
                },
                "visualization": {
                    "type": "cartesian",
                    "parameters": {},
                },
                "experiments": [],
                "breakIt": [],
                "challenges": [],
                "debugging": [],
                "relatedConcepts": m.get("relatedDomains", []),
                "nextConcepts": [],
            }
            added_from_math += 1

    print(f"Added {added_from_math} new concepts from mathematics.")

    # 6. Validate all concepts with Pydantic
    all_concepts_list = list(concepts_by_id.values())
    validated_list = []
    for c_dict in all_concepts_list:
        try:
            concept_obj = Concept(**c_dict)
            validated_list.append(concept_obj.model_dump())
        except Exception as e:
            print(f"Validation error on {c_dict.get('id')}: {e}")
            raise

    print(f"Successfully validated all {len(validated_list)} concepts with Pydantic!")

    # 7. Write to backend concepts.json
    with open(existing_file, "w", encoding="utf-8") as f:
        json.dump(validated_list, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(validated_list)} concepts to {existing_file}.")

if __name__ == "__main__":
    main()
