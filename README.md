# dash-platform-console

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

# Documentation
# Deep-links


Platform console supports deep-links to contracts and search queries to share and bookmark onchain data.

 A deep-link **must** include the `contractId` and may include additional query paramaters as shown below:

## Link Structure

>http://console.dashevo.io/#/platform/`${contractId}`/?`${QueryParams}`


## Optional Query parameters


| QueryParams | Example | Description |
| ------ | ------ | ------ |
| showcontract | true | If present, expands the contract editor |
| type | PaymentRequest | The document type, **required** to deeplink a search / query |
| querydocs | true | If present, starts a search with *default* or provided `queryopts` |
|  queryopts | %257B%2522limit%2522%253A1%252C%2|  The URI encoded [queryOpts](https://dashplatform.readme.io/docs/reference-query-syntax#example-query) e.g. in JavaScript: `encodeURIComponent(JSON.stringify(queryOpts)`, 

## Example deeplinks

> 1. **Show expanded contract** http://console.dashevo.io/#/platform/9FhqPBkmrmNkoUGw5qQgv7x6MUJJNNS4sfrTeUB1UsYk?showcontract=true

> 2. **Select Document Type and search with queryOptions** http://console.dashevo.io/#/platform/9FhqPBkmrmNkoUGw5qQgv7x6MUJJNNS4sfrTeUB1UsYk?querydocs=true&type=PaymentRequest&queryopts=%257B%2522limit%2522%253A10%252C%2522startAt%2522%253A1%252C%2522orderBy%2522%253A%255B%255B%2522accountDocId%2522%252C%2522desc%2522%255D%255D%252C%2522where%2522%253A%255B%255B%2522accountDocId%2522%252C%2522%253D%253D%2522%252C%25222Pz2pbZUVmYGv3t25ERY6BZKv8xTU67ZoqhRpsGgju3H%2522%255D%255D%257D
