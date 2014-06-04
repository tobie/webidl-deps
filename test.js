var webidl2 = require("webidl2");
var deps = require("./index.js");
var assert = require("assert");

function getDeps(sample) {
    sample = webidl2.parse(sample);
    return deps(sample);
}

suite("basic types", function() {
    test("typedef", function() {
        var d = getDeps("typedef ScalarValueString Foo;");
        assert.equal(d.defined[0].name, "Foo");
        assert.equal(d.defined.length, 1);
        assert.equal(d.dependencies[0].name, "ScalarValueString");
        assert.equal(d.dependencies.length, 1);
    });
    
    test("enum", function() {
        var d = getDeps('enum RequestOmitCredentialsMode { "always", "CORS", "never" };');
        assert.equal(d.defined[0].name, "RequestOmitCredentialsMode");
        assert.equal(d.dependencies.length, 0);
        assert.equal(d.coreDependencies.length, 0);
    });
    
    test("interface", function() {
        var d = getDeps('interface Foo { };');
        assert.equal(d.defined[0].name, "Foo");
        assert.equal(d.dependencies.length, 0);
        assert.equal(d.coreDependencies.length, 0);
    });
    
    test("core types", function() {
        var d = getDeps("typedef boolean Foo;");
        assert.equal(d.defined[0].name, "Foo");
        assert.equal(d.coreDependencies[0].name, "boolean");
        assert.equal(d.defined.length, 1);
        assert.equal(d.dependencies.length, 0);
        assert.equal(d.coreDependencies.length, 1);
    });
    
    test("referenced types", function() {
        var d = getDeps("typedef Bar Foo;");
        assert.equal(d.defined[0].name, "Foo");
        assert.equal(d.dependencies[0].name, "Bar");
        assert.equal(d.defined.length, 1);
        assert.equal(d.dependencies.length, 1);
        assert.equal(d.coreDependencies.length, 0);
    });

    test("unions types", function() {
        var d = getDeps("typedef (boolean or DOMString or Bar) Foo;");
        assert.equal(d.defined[0].name, "Foo");
        assert.equal(d.dependencies[0].name, "Bar");
        assert.equal(d.coreDependencies[0].name, "boolean");
        assert.equal(d.coreDependencies[1].name, "DOMString");
    });
});

test("fragments with a NoInterfaceObject attribute aren't exposed.", function() {
    var d = getDeps('[NoInterfaceObject]\ninterface GlobalFetch {};');
    assert.equal(d.defined.length, 0);
});

suite("Implements fragments", function() {
    test("don't expose an interfaces", function() {
        var d = getDeps('Foo implements Bar;');
        assert.equal(d.defined.length, 0);
    });

    test("reference target and source", function() {
        var d = getDeps('Foo implements Bar;');
        assert.equal(d.dependencies[0].name, "Foo");
        assert.equal(d.dependencies[1].name, "Bar");
        assert.equal(d.dependencies.length, 2);
    });
});


suite("Members", function() {
    test("attribute reference core types", function() {
        var d = getDeps('interface Bar { readonly attribute boolean foo; };');
        assert.equal(d.coreDependencies[0].name, "boolean");
        assert.equal(d.dependencies.length, 0);
        assert.equal(d.coreDependencies.length, 1);
    });
    
    test("attribute reference custom types", function() {
        var d = getDeps('interface Bar { readonly attribute Foo foo; };');
        assert.equal(d.dependencies[0].name, "Foo");
        assert.equal(d.dependencies.length, 1);
        assert.equal(d.coreDependencies.length, 0);
    });
    
    test("method return type", function() {
        var d = getDeps('interface Bar { Foo foo(); };');
        assert.equal(d.dependencies[0].name, "Foo");
        assert.equal(d.dependencies.length, 1);
        assert.equal(d.coreDependencies.length, 0);
    });
    
    test("method arguments type", function() {
        var d = getDeps('interface Bar { ByteString foo(DOMString s, Foo f); };');
        assert.equal(d.dependencies[0].name, "Foo");
        assert.equal(d.dependencies.length, 1);
        assert.equal(d.coreDependencies[0].name, "ByteString");
        assert.equal(d.coreDependencies[1].name, "DOMString");
        assert.equal(d.coreDependencies.length, 2);
    });
});

suite("Generics", function() {
    test("Promises", function() {
        var d = getDeps('interface Bar { Promise<DOMString> foo(); };');
        assert.equal(d.coreDependencies.length, 2);
        assert.equal(d.coreDependencies[0].name, "Promise");
        assert.equal(d.coreDependencies[1].name, "DOMString");
        assert.equal(d.dependencies.length, 0);
    });
    
    test("Sequences", function() {
        var d = getDeps('interface Bar { sequence<DOMString> foo(); };');
        assert.equal(d.coreDependencies.length, 2);
        assert.equal(d.coreDependencies[0].name, "sequence");
        assert.equal(d.coreDependencies[1].name, "DOMString");
        assert.equal(d.dependencies.length, 0);
    });
});