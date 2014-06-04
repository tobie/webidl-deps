webidl-deps
===========

`webidl-deps` consumes a WebIDL AST and returns the list of external
dependencies referenced along with those defined by the AST.

Usage
-----

Given the following WebIDL fragment:

``` webidl
[NoInterfaceObject]
interface GlobalFetch {
  Promise<Response> fetch(RequestInfo input, optional RequestInit init);
};
Window implements GlobalFetch;
WorkerGlobalScope implements GlobalFetch;
```

``` javascript
var ast = require("webidl2").parse(fragment);
var deps = require("webidl-deps");
deps(ast);
```

yields: 

``` json
{
    "defined": [],
    "dependencies": [
        { "name": "Response" },
        { "name": "RequestInfo" },
        { "name": "RequestInit" },
        { "name": "Window" }
    ],
    "coreDependencies": []
}
```

License
-------

MIT
