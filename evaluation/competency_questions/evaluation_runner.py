import yaml
import rdflib
import argparse

public_eval_instances = [
    "evaluation/competency_questions/sample_instances.rdf",
    "application_scenarios/scenario1.rdf",
    "application_scenarios/scenario2.rdf"
]
competency_questions_path = "evaluation/competency_questions/competency_questions.yaml"

def run_competency_questions(instance_graph_path):
    try:
        with open(competency_questions_path, 'r') as file:
            cqs = yaml.safe_load(file)

        g = rdflib.Graph()
        g.parse(instance_graph_path)
        
        if 'competency questions' in cqs:
            print("Iterating over competency questions...\n")
            
            for category, questions in cqs['competency questions'].items():
                print(f"Category: {category}")
                
                for idx, question_data in enumerate(questions, start=1):
                    question = question_data.get('question', 'No question provided')
                    example = question_data.get('example', 'No example provided')
                    query = question_data.get('query', 'No query provided')
                    
                    print(f"Question: {question}")
                    print(f"Example: {example}")
                    print(f"Query: {query}\n")

                    results = g.query(query)
                    print(f"Result:\n")
                    for row in results:
                        for var_name, value in zip(results.vars, row):
                            print(f"{var_name}: {value}")
                        print("------------------------------------------")
                    print("------------------------------------------")
        else:
            print("No 'competency questions' found in the YAML file.")
    except FileNotFoundError:
        print(f"The file '{competency_questions_path}' was not found.")
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
    except rdflib.exceptions.Error as e:
        print(f"Error parsing RDF file: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run competency questions on an RDF instance graph.")
    parser.add_argument(
        "instance_index",
        type=int,
        choices=range(0, 3),
        help="Index of the RDF instance graph to use (0: sample instances, 1: application scenario 1, 2: application scenario 2)"
    )
    args = parser.parse_args()

    instance_graph_path = public_eval_instances[args.instance_index]

    run_competency_questions(instance_graph_path)