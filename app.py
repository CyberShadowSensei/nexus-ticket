from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_engine import AIEngine

app = Flask(__name__)
CORS(app)

engine = AIEngine()


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "ticket-ai-backend"
    }), 200


@app.route("/api/cluster", methods=["POST"])
def cluster_tickets():
    data = request.get_json() or {}
    tickets = data.get("tickets", [])
    if not tickets:
        return jsonify({"error": "No tickets provided in request payload."}), 400

    provider = data.get("provider", "auto")
    api_key = data.get("api_key")
    model = data.get("model")

    result = engine.cluster_tickets(tickets, provider=provider, api_key=api_key, model=model)
    return jsonify(result), 200


@app.route("/api/answer", methods=["POST"])
def answer_ticket():
    data = request.get_json() or {}
    ticket_text = data.get("ticket_text") or data.get("text") or data.get("query")
    if not ticket_text:
        return jsonify({"error": "ticket_text is required in request payload."}), 400

    provider = data.get("provider", "auto")
    api_key = data.get("api_key")
    model = data.get("model")

    result = engine.generate_answer(ticket_text, provider=provider, api_key=api_key, model=model)
    return jsonify(result), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
