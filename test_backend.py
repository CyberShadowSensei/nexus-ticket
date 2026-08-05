import sys
from ai_engine import AIEngine

def test_engine():
    engine = AIEngine()

    test_tickets = [
        {"id": "t1", "text": "I forgot my password, how to reset it?"},
        {"id": "t2", "text": "I can't log in, as password is incorrect."},
        {"id": "t3", "text": "How to see leave balance?"}
    ]

    print("--- Testing Ticket Clustering ---")
    cluster_result = engine.cluster_tickets(test_tickets, provider="auto")
    print(cluster_result)

    print("\n--- Testing Password Reset Answer ---")
    ans_pass = engine.generate_answer("I forgot my password, how to reset it?")
    print(ans_pass)

    print("\n--- Testing Leave Balance Answer ---")
    ans_hr = engine.generate_answer("How to see leave balance?")
    print(ans_hr)

    assert len(cluster_result["clusters"]) >= 2, "Clustering should return at least 2 groups"
    print("\n[SUCCESS] All backend engine tests passed!")

if __name__ == "__main__":
    test_engine()
