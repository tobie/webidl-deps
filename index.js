var compose = require("fncmp");
var prop = require("prop");

var BASIC_TYPES = [
    "any",
    "boolean",
    "byte",
    "octet",
    "short",
    "unsigned short",
    "long",
    "unsigned long",
    "long long",
    "unsigned long long",
    "float",
    "unrestricted float",
    "double",
    "unrestricted double",
    "DOMString",
    "ByteString",
    "object"
];

function toObj(k) {
    return function (v) {
        var obj = {};
        obj[k] = v;
        return obj;
    }
}

function addProp(k, v) {
    return function (obj) {
        obj[k] = v;
        return obj;
    }
}

function isNoInterfaceObj(obj) {
    return obj.name == "NoInterfaceObject";
}

module.exports = function(fragments) {
    var types = [];
    var no_interface = [];
    var missing_types = [];
    var basic_types = [];
    
    function findIdlType(type) {
        if (Array.isArray(type)) {
            return type.map(findIdlType);
        }
        if (typeof type === "object") {
            if (type.generic) {
                basic_types.push({ name: type.generic });
            }
            return findIdlType(type.idlType);
        }
        return type;
    }

    function addMissing(items) {
        if (!Array.isArray(items)) {
            items = [items];
        }
        
        items = items.map(function(item) {
            return typeof item === "string" ? { name: item } : item;
        });
        
        items.forEach(function(item) {
            function cmp(e) {
                return e.name === item.name;
            }
            if (BASIC_TYPES.indexOf(item.name) >= 0) {
                if (!basic_types.some(cmp)) {
                    basic_types.push(item);
                }
            } else if (!types.some(cmp) && !missing_types.some(cmp) && !no_interface.some(cmp)) {
                missing_types.push(item);
            }
        });
    }
    
    function addTypesFromFrag(f) {
        if (f.type == "implements") {
            compose(addMissing, addProp("type", "implements-target"), toObj("name"), prop("target"))(f);
            compose(addMissing, addProp("type", "implements-source"), toObj("name"), prop("implements"))(f);
            return;
        }
        
        if (f.members) {
            f.members.forEach(addTypesFromFrag);
        }
        
        if (f.idlType) {
            compose(addMissing, findIdlType, prop("idlType"))(f);
        }
        
        if (f.arguments) {
            f.arguments.forEach(addTypesFromFrag);
        }
        
        if (f.typePair) {
            f.typePair.forEach(addTypesFromFrag);
        }
                
        if (f.extAttrs) {
            f.extAttrs.forEach(addTypesFromFrag);
        }

        if (f.inheritance) {
            compose(addMissing, addProp("type", "subclass"), toObj("name"), prop("inheritance"))(f);
        }
    }
    
    fragments.forEach(function(f) {
        if (f.extAttrs && f.extAttrs.some(isNoInterfaceObj)) {
            no_interface.push({ name: f.name });
            return;
        }
        
        if (f.type == "implements") {
            return;
        }
        
        types.push({ name: f.name });
    });
    fragments.forEach(addTypesFromFrag);
    
    return {
        defined: types,
        dependencies: missing_types,
        coreDependencies: basic_types,
        noInterface: no_interface
    };
};