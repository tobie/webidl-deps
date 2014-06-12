"use strict";

var BASIC_TYPES = [
    "void",
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

function isNoInterfaceObj(obj) {
    return obj.name == "NoInterfaceObject";
}

module.exports = function(fragments) {
    var _noInterface = [];
    var types = [];
    var dependencies = [];
    var coreDependencies = [];
    
    function findIdlType(type) {
        if (Array.isArray(type)) {
            return type.map(findIdlType);
        }
        if (typeof type === "object") {
            if (type.generic && !coreDependencies.some(function(e) { return e.name === type.generic; })) {
                coreDependencies.push({ name: type.generic });
            }
            return findIdlType(type.idlType);
        }
        return type;
    }

    function addDependency(items) {
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
                if (!coreDependencies.some(cmp)) {
                    coreDependencies.push(item);
                }
            } else if (!types.some(cmp) && !dependencies.some(cmp) && !_noInterface.some(cmp)) {
                dependencies.push(item);
            }
        });
    }
    
    function addTypesFromFrag(f) {
        if (f.type === "implements") {
            addDependency({ name: f.target, type: "implements-target" });
            addDependency({ name: f.implements, type: "implements-source" });
            return;
        }
        
        if (f.type === "interface" && f.partial) {
            addDependency({ name: f.name, type: "partial-interface" });
            return;
        }
        
        if (f.members) {
            f.members.forEach(addTypesFromFrag);
        }
        
        if (f.idlType) {
            addDependency(findIdlType(f.idlType));
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
            addDependency({ name: f.inheritance, type: "subclass" });
        }
    }
    
    fragments.forEach(function(f) {
        if (f.extAttrs && f.extAttrs.some(isNoInterfaceObj)) {
            _noInterface.push({ name: f.name });
            return;
        }
        if (f.type === "implements") { 
            return;
        }
        if (f.type === "interface" && f.partial) {
            return;
        }
        types.push({ name: f.name });
    });
    
    fragments.forEach(addTypesFromFrag);
    
    return {
        defined: types,
        dependencies: dependencies,
        coreDependencies: coreDependencies
    };
};