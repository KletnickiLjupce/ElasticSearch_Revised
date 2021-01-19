// Field title(text) cant be sorted by default
// This Query is a workaround, its set title as fielddata
PUT bookdb_index/_mapping --"Validation Failed: 1: mapping type is missing;" thrown, should be "PUT bookdb_index/book/_mapping"
{
    "properties":{
        "title":{
            "type":"text",
            "fielddata":true
        }
    }
}

? 2. Search for all books that contain the term "Php" and return only "title", "summary" and "author" fields sorted by title 
GET bookdb_index/book/_search?q=php -- fails because of failed mapping
{
    "_source": [
        "title",
        "summary",
        "authors"
    ],
    "sort": {
        "title": "desc"
    }
}

? 3. Search for all books that contain the term "programming language" and return only "title", "summary" and "author" fields sorted by title and highlight the match 
GET bookdb_index/book/_search -- same as 2.
{
    "query": {
        "multi_match": {
            "query": "programming language",
            "fields": [
                "title",
                "authors",
                "summary",
                "publisher"
            ]
        }
    },
    "_source": [
        "title",
        "summary",
        "authors"
    ],
    "highlight": {
        "fields": {
            "title": {},
            "summary": {},
            "authors": {}
        }
    },
    "sort": {
        "title": "desc"
    }
}

? 4. Search for all books that contain the term "Engine" and return only "title", "summary" and "author" fields sorted by title but boost the filed "summary" by 4 
GET bookdb_index/book/_search -- same as 2.
{
    "query": {
        "multi_match" : {
            "query" : "Engine",
            "fields" : ["title", "authors", "summary^4", "publisher"]
        }
    },
        "_source" : ["title","summary","authors"],
        "sort": [
        { "title": {"order":"asc"}}
    ]

}

? 5. Search for a book with the word “Elastic”, “Php” OR "Engine" in the title, AND is published later than 2018 
GET bookdb_index/book/_search
{
  "query": {
    "bool": {
      "must": {
       "multi_match" : {
            "query" : "Engine", -- "elastic" and "php" are missing
            "fields" : ["title"]
       }
      },
      "filter": {
         "range": {
            "publish_date": {
              "gte": "2020-01-01",
              "format": "yyyy-MM-dd"
            }
          }
      }
    }
  }
}

6. Search for a book with the word “Elastic”, “Programming” OR "Engine" in the title, AND is published in February 2020
GET bookdb_index/book/_search
{
  "query": {
    "bool": {
      "must": {
       "multi_match" : {
            "query" : "Engine Programming Elastic",
            "fields" : ["title"]
       }
      },
      "filter": {
         "range": {
            "publish_date": {
              "gte": "2020-02-01",
              "lt":"2020-03-01",
              "format": "yyyy-MM-dd"
            }
          }
      }
    }
  }
}

? 7. Search for a book with the word “Elastic” OR “Engine” in the summary, AND is NOT published in 2019 
GET bookdb_index/book/_search
{
    "query": {
        "bool": {
            "must": [
                {
                    "query_string": {
                        "query": "(Elastic) OR (Engine)",
                        "default_field": "title" -- this should be "summary"
                    }
                },
                {
                    "range": {
                        "publish_date": { -- this range is not by the requirement
                            "gte": "2020-02-01",
                            "lte": "2020-02-31",
                            "format": "yyyy-MM-dd"
                        }
                    }
                }
            ]
        }
    }
}

8. Search for all records that have an author whose name begins with the letters 'ma'
GET bookdb_index/book/_search
{
    "query": {
        "wildcard": {
            "authors": "ma*"
        }
    },
    "_source": [
        "title",
        "authors"
    ]
}

? 9. Search for records that have an author whose surname matches an regex (the regex can be whatever you want, depending on your input data) using regexp query that will return at least 3 results
GET bookdb_index/book/_search -- it returns only 1 result, the requirement was to return at least 3
{
    "query": {
        "regexp": {
            "authors": "c[a-z]*n"
        }
    }
}

? 10. Search for all books that has more than 200 and less than 1000 reviews and contain the term "Programming" in "title" and "summary" 
GET bookdb_index/book/_search
{
    "query": {
        "bool": {
            "must": {
                "multi_match": {
                    "query": "Programming",
                    "fields": [
                        "title" -- you should add "summary" as well, by the requirement
                    ]
                }
            },
            "filter": {
                "range": {
                    "num_reviews": {
                        "gt": "200",
                        "lt": "1000"
                    }
                }
            }
        }
    }
}

? 11. Get the average number of reviews for the records that has "Programming" in the title or "Programming" in the summary
GET bookdb_index/book/_search
{
    "query": {
        "bool": {
            "should": [
                {
                    "match": {
                        "title": "Programming"
                    }
                },
                {
                    "match": {
                        "summary": "Programming" -- the requirement that I gave you was to search "Engine" in "summary" 
                    }
                }
            ]
        }
    },
    "aggs": {
        "ElasticsearchOrGuide": {
            "sampler": {
                "shard_size": 200
            },
            "aggs": {
                "AverageNumOfRevires": {
                    "avg": {
                        "field": "num_reviews"
                    }
                }
            }
        }
    }
}
}