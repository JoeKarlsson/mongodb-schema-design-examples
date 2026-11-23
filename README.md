# MongoDB Schema Design Examples

[![Examples](https://github.com/JoeKarlsson/mongodb-schema-design-examples/actions/workflows/examples.yml/badge.svg)](https://github.com/JoeKarlsson/mongodb-schema-design-examples/actions/workflows/examples.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24451384.svg)](https://doi.org/10.5281/zenodo.24451384)

Every relationship pattern from MongoDB Schema Design Best Practices, from one-to-one to one-to-squillions, as a mongosh script you can run, with the query that reads each one.

[Read the article](https://www.joekarlsson.com/talks/mongodb-schema-design-best-practices/) · [Watch the talk](https://www.youtube.com/watch?v=leNCfU5SYR8)

## Quick start

You need [Docker](https://docs.docker.com/get-docker/), or a MongoDB you can reach plus [mongosh](https://www.mongodb.com/docs/mongodb-shell/install/).

```bash
git clone https://github.com/JoeKarlsson/mongodb-schema-design-examples.git
cd mongodb-schema-design-examples
docker run -d --name schema-examples -p 27017:27017 mongo:8
docker run --rm --network host -v "$PWD:/work" mongo:8 mongosh --quiet "mongodb://localhost:27017" /work/examples.mongodb.js
```

With mongosh installed and MongoDB already running:

```bash
mongosh "mongodb://localhost:27017" examples.mongodb.js
```

Each pattern prints `ok` when its query returns what the article says it should:

```
ok  one-to-one: one query returns the whole user
ok  one-to-few: query on an embedded address
ok  one-to-many: one $lookup brings back all three parts
ok  one-to-squillions: a host's newest logs come first, through the index
ok  many-to-many: look up from either side
```

The script works in a database of its own, `schema_design_examples`, and resets it on every run.

## What each example shows

| Pattern | Model | Read it with |
| --- | --- | --- |
| One-to-one | key-value pairs in the user document | one `findOne` |
| One-to-few | a small embedded array of addresses | a query on the embedded field |
| One-to-many | the product keeps an array of part ids | one `$lookup` |
| One-to-squillions | each log message stores its host's id | an indexed `find` on `host` and `time` |
| Many-to-many | users keep task ids, tasks keep owner ids | `$lookup` from either side |

## Development

Edit `examples.mongodb.js` and run it again. GitHub Actions runs it against MongoDB 7, 8 and the latest release on every push and every Monday, so a change in MongoDB that breaks an example shows up here first.

## Citing

GitHub's "Cite this repository" button uses [CITATION.cff](CITATION.cff), which points to the article.

## License

[MIT](LICENSE)
