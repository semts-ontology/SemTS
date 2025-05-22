import rdflib
import competency_questions as cq

g = rdflib.Graph()
g.parse("instances.rdf")

for q in [cq.q11, cq.q12, cq.q13, cq.q21, cq.q22, cq.q23, cq.q31, cq.q32, cq.q33]:
  print("--------- Query ---------")
  print(q)
  print("--------- Result ---------")
  results = g.query(q)
  for row in results:
    for var_name, value in zip(results.vars, row):
        print(f"{var_name}: {value}")
    print("---")