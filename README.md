# Zasta Coding Challenge: Build a Data Privacy Vault

## Usage

```sh
npm run dev:docker # run development server with Postgresql database in Docker environment
npm run dev:local # run development server - environment variables specified in ./.env have to be passed in
npm run test # run tests - Docker needs to be installed
```

## About

### Step 0: Setup

* Programming language: I chose Typescript as a programming language as it is one of the languages used at Zasta.
* NodeJS/ExpressJS: I chose NodeJS as my Javascript runtime environment and ExpressJS as my web application framework because those are tools that I am familiar with and they are also widely known in the Javascript ecosystem. I know that there are potentially better/more modern options but these two get the job done as well.
* Testing: I went for the approach to run requests against the endpoins of the Express app using different inputs and asserting the outputs. These E2E tests run relatively fast, achieve good code coverage, give me high confidence in my code and align very well with TDD. For a larger application I would add more unit tests and integration tests.

### Step 1: Create Toeknization Service

I created two endpoints (POST `/tokenize` and POST `/detokenize`) to respectively tokenize and detokenize intput. I chose to use **UUIDs** as the format for the tokens as they are unique, widely supported by DBs, random and non sequential. Thereby external clients don't get any valuable insights into my tokenization system (eg. how many tokens exist altogether). Also, the tokens and associated values don't have any logical connection except through the mapping of them as part of my tokenization system.

The mapping of the tokens and the associated values is achieved by an in-memory map data structure. I created another map data structure to store relations between IDs, field keys and tokens as specified by the task:
  
  ```json
  {
    "id": "req-123",
    "data": {
      "field1": "value1",
      "field2": "value2",
      "fieldn": "valuen"
    }
  }
  ```

### Step 2: Persistent Storage and Encryption

I chose PostgreSQL as my persistence layer as I can use it to define constraints useful to my application on the database level. Also it is probably the most widespread relational database out there but at least the one that I have the most experience with. I removed the logic from the previous step that validates the relations between IDs, field keys and tokens as this would have overcomplicated the application. I left the tests testing this logic in place but "skipped" them.

The to be tokenized values can only be string values.

For testing, I added the `testcontainers` package to run my tests together with a real database. This gives me more confidence and is easier to manage than for example mocking my database interactions.

I encrypt the values on the application level and not on the database level. If potential intruders would have access to the database, they would still not know what method was used to encrypt the data nor would they have the key (which should be kept separately) to decrypt the data.

The encryption/decryption process slows down the writing into or reading from the DB. This is why I only encrypt the values and not the tokens themselves as the extra benefit would be small. For a public facing system constraints should be added that limit the size of the values and rate limiting should be employed.

### Step 3: Authentication and Authorization

To implement authentication and authorization I added another endpoint (POST `/auth`) that returns an JWT token based on the authentication credentials. JWT are self-contained which means that I don't have to keep any information on the session at my web application. Also I can add information about the session or the user/service to the payload of the JWT token such as its role.

This is a rudimentary implementation of an authentication system. The JWT tokens are not encrypted. OAuth is not implemented. Conceptually, the authentication system should be a standalone authentication system, separated from the tokenization system.

I went for a role-based authorization system.

* `VISITOR` role: is not authorized to tokenize nor detokenize
* `TOKENIZER` role: is only authorized to tokenize
* `DETOKENIZER` role: is authorized to tokenize and detokenize

### General

This is a very simple implementation of a tokenization system. There is lots of room for improvements - some potential improvements are denoted in the code by a comment prefixed with `// NOTE: <note>`.

I'm happy to receive your feedback!
