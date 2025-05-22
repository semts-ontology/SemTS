q11 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>

SELECT ?segment ?title ?datasetColumnIndex ?timeIndex
WHERE {
    ?segment semts:title ?title .
    ?segment semts:datasetColumnIndex ?datasetColumnIndex .
    ?segment semts:segmentIndex ?timeIndex .
}
LIMIT 5
'''

q12 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX qudt: <http://qudt.org/schema/qudt#>

SELECT ?knowledge ?value ?datatype
WHERE {
    ?segment semts:segmentKnowledge ?knowledge .
    ?knowledge semts:hasValue ?value .
    ?value semts:hasDatatype ?datatype .
    OPTIONAL { ?datatype rdf:type qudt:Datatype }
}
LIMIT 1
'''

q13 = ''' 
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX time: <http://www.w3.org/2006/time#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?segment ?startTime ?endTime
WHERE {
    ?segment semts:segmentIndex ?timeEntity .
    
    {
        ?timeEntity a time:DateTimeInterval ;
                  time:hasBeginning ?startPoint ;
                  time:hasEnd ?endPoint .
        ?startPoint time:inXSDDateTime ?startTime .
        ?endPoint time:inXSDDateTime ?endTime .
        
        FILTER(?startTime >= "2024-01-01T00:00:00"^^xsd:dateTime && 
               ?endTime <= "2024-01-09T07:59:59"^^xsd:dateTime)
    }
    UNION
    {
        ?timeEntity a time:Instant ;
                  time:inXSDDateTime ?pointTime .
        
        BIND(?pointTime AS ?startTime)
        BIND(?pointTime AS ?endTime)
        
        FILTER(?pointTime >= "2024-01-01T00:00:00"^^xsd:dateTime && 
               ?pointTime <= "2024-01-09T07:59:59"^^xsd:dateTime)
    }
}
'''

q21 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX semts-dv: <https://w3id.org/semts/vocabulary/data-knowledge#>

SELECT ?segment ?valueString ?datasetColumnIndex
WHERE {
    ?segment semts:segmentKnowledge ?knowledge .
    ?segment semts:datasetColumnIndex ?datasetColumnIndex .
    ?knowledge semts:knowledgeConcept semts-dv:LinearSlope .
    ?knowledge semts:hasValue ?value .
    ?value semts:valueString ?valueString .
    FILTER (xsd:float(?valueString) > 1)
}
LIMIT 2
'''

q22 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX time: <http://www.w3.org/2006/time#>

SELECT DISTINCT ?concept
WHERE {    
    ?segment a semts:TimeSeriesSegment ;
             semts:segmentIndex ?timeEntity ;
             semts:segmentKnowledge ?knowledge .

    ?knowledge semts:knowledgeConcept ?concept .
    
    {
        ?timeEntity a time:DateTimeInterval ;
                  time:hasBeginning ?startPoint ;
                  time:hasEnd ?endPoint .
        ?startPoint time:inXSDDateTime ?startTime .
        ?endPoint time:inXSDDateTime ?endTime .
        
        FILTER("2024-01-02T12:00:00"^^xsd:dateTime >= ?startTime && "2024-01-02T12:00:00"^^xsd:dateTime <= ?endTime)
    }
    UNION
    {
        ?timeEntity a time:Instant ;
                  time:inXSDDateTime ?pointTime .
        BIND(?pointTime AS ?startTime)
        BIND(?pointTime AS ?endTime)
        FILTER("2024-01-02T12:00:00"^^xsd:dateTime = ?pointTime)
    }

}
'''

q23 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX semts-sv: <https://w3id.org/semts/vocabulary/scenario-knowledge#>

SELECT ?segment ?datasetColumnIndex
WHERE {
    ?segment semts:segmentKnowledge ?knowledge .
    ?segment semts:datasetColumnIndex ?datasetColumnIndex .
    ?knowledge semts:knowledgeConcept semts-sv:Label .
}
'''

q31 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX mlso: <http://w3id.org/mlso/vocab/ml_algorithm#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?knowledge
WHERE {
  ?knowledge semts:knowledgeGenerationEntity ?generationEntity .
  ?generationEntity semts:knowledgeGenerationConcept mlso:FeatureExtraction .
}
'''

q32 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?segment ?knowledgeGeneration
WHERE {
  ?knowledgeGeneration semts:used ?input .
  ?input rdf:type semts:KnowledgeGenerationInput .
  ?input semts:inputDataReference ?segment .
}
'''

q33 = '''
PREFIX semts: <https://w3id.org/semts/ontology#>

SELECT ?knowledge ?generationType
WHERE {
  ?segment semts:segmentKnowledge ?knowledge
  FILTER NOT EXISTS { ?knowledge semts:knowledgeGenerationEntity ?entity }
  
  BIND("No Generation Entity" AS ?generationType)
}
'''

question_dict = {
    "Data Management": [ 
        {
            "question": "Is it possible to identify segment metadata associated with scenario-specific knowledge?",
            "example": "Get title, dataset column index and time index of 5 segments.",
            "query": q11
        },
        {
            "question": "Is it possible to retrieve details on a knowledge value associated with a segment",
            "example": "Get the datatype of an arbitrary knowledge value.",
            "query": q12
        },
        {
            "question": "Is it possible to identify all segments within a particular time window?",
            "example": "Retrieve all segments between '2024-01-01T00:00:00' and '2024-01-09T07:59:59'.",
            "query": q13
        }
    ],
    "Knowledge Classification": [ 
        {
            "question": "Is it possible to retrieve any segment representing particular data knowledge?",
            "example": "Retrieve two segments having a positive linear trend with slope greater or equal to 1.",
            "query": q21
        },
        {
            "question": "Is it possible to identify all knowledge concepts occurring in a certain time frame of a time series?",
            "example": "Retrieve all knowledge concepts associated with segments overlapping with time '2024-01-02T12:00:00'.",
            "query": q22
        },
        {
            "question": "Is it possible to filter the data based on scenario knowledge?",
            "example": "Retrieve all segments which are annotated by a label.",
            "query": q23
        }
    ],
    "Knowledge Generation": [ 
        {
            "question": "Is it possible to retrieve knowledge that was generated by a particular analysis method?",
            "example": "Retrieve all knowledge instances generated by Feature Extraction",
            "query": q31
        },
        {
            "question": "Is it possible to list all segments that contributed to the generation of knowledge?",
            "example": "List all segments which served as input to the generation of knowledge",
            "query": q32
        },
        {
            "question": "Is it possible to retrieve knowledge based on specifics from the generation process?",
            "example": "Retrieve any prior knowledge, which means any knowledge that was not derived from raw data or other knowledge.",
            "query": q33
        }
    ]
}
