import json
import uuid
from pathlib import Path

from flask import Flask, jsonify, make_response, render_template, request

app = Flask(__name__, static_url_path="/static")


# Function to save survey data for a user
def save_survey_data(data):
    # Log the pretty printed data (optional)
    print("Received Data:")
    print(json.dumps(data, indent=4, sort_keys=True))

    # Generate a UUID for the user
    user_id = str(uuid.uuid4())

    # Define the directory to store user data
    results_dir = Path.cwd() / "results"

    # Create the directory if it doesn't exist
    results_dir.mkdir(parents=True, exist_ok=True)

    # Construct the file path for the user's data
    file_path = results_dir / f"{user_id}.json"

    # Write the data to a JSON file
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4, sort_keys=True)


@app.route("/")
def index():
    # Serve the main HTML document
    return render_template("index.html")


@app.route("/data", methods=["POST"])
def receive_results():
    # Receive POST request from client with JSON data
    data = request.get_json()

    save_survey_data(data)

    # Return acknowledgment to the client
    return make_response(jsonify(dict(message="Success")), 201)


if __name__ == "__main__":
    # Run the Flask application on localhost at port 1988
    app.run(host="0.0.0.0", port=1988, debug=True)
