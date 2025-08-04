# Competency Questions Runner

This evaluation provides a Python script to evaluate competency questions defined in a YAML file against an RDF graph. The script uses `PyYAML` for parsing YAML files and `rdflib` for handling RDF data and executing SPARQL queries. Despite being used for the evaluation of SemTS with sensitive project data, it can be applied to different datasets provided in this repository.
A selection of these datasets is facilitated through a command-line argument (see section Usage).

---

## Features

- Parses competency questions from a YAML file.  
- Loads an RDF graph from a file.  
- Executes SPARQL queries defined in the competency questions YAML file.  
- Prints the query results for evaluation.  

---

## Prerequisites

- Python 3.7 or newer installed on your system.

---

## Installation

1. **Set up a virtual environment**:  
python -m venv venv source venv/bin/activate # On Windows: venv\Scripts\activate

2. **Install dependencies**:  
Use the provided `requirements.txt` file to install the necessary libraries: pip install -r requirements.txt
---

## Usage

1. **Run the Script with an RDF Instance**:  
   The script supports dynamic selection of RDF instance graphs based on a console argument.
   Use the `instance_index` argument to specify which RDF instance to evaluate.  
   Right now, the script supports one general, synthetic dataset and two modified samples of datasets from the application scenarios folder.
   Valid values for `instance_index` are:  
   - `0`: `evaluation/competency_questions/sample_instances.rdf`  
   - `1`: `application_scenarios/scenario1.rdf`  
   - `2`: `application_scenarios/scenario2.rdf`<br>
     Example usage: python evaluation_runner.py 0

2. **Output**:  
The script will print the competency questions and their corresponding SPARQL query results to the console.
