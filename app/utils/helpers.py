from typing import List
from app.models.schemas import NGO


MOCK_NGOS: List[NGO] = [
    NGO(name="Seva Health Collective", category="health", contact="+91-90000-00001"),
    NGO(name="Jal Suraksha Foundation", category="water", contact="+91-90000-00002"),
    NGO(
        name="Nari Safety Network",
        category="women-safety",
        contact="+91-90000-00003",
    ),
    NGO(
        name="Food Relief Mission",
        category="food-support",
        contact="+91-90000-00004",
    ),
]


def choose_ngo_by_category(category: str) -> NGO:
    normalized = category.strip().lower()
    for ngo in MOCK_NGOS:
        if normalized in ngo.category or ngo.category in normalized:
            return ngo
    return MOCK_NGOS[0]
