/**
 * Just a small wrapper around Google App Engine
 * low-level datastore api
 */
importPackage(com.google.appengine.api.datastore);

var googlestore = (function(){

    // syntax sugar
    var filterOperators = {
        '<' : 'LESS_THAN',
        '<=': 'LESS_THAN_OR_EQUAL',
        '=' : 'EQUAL',
        '>' : 'GREATER_THAN',
        '>=': 'GREATER_THAN_OR_EQUAL',
        '!=': 'NOT_EQUAL'
    };

    var sortDirections = {
        'ASC' : 'ASCENDING',
        'DESC': 'DESCENDING'
    };

    return {
        datastore: DatastoreServiceFactory.getDatastoreService(),

        // creates a new entity
        // (kind, [opt] keyName/keyId, [opt] properties)
        entity: function(arg0, arg1, arg2) {
            var data, entity;
            if (arg2) {
                entity = new Entity(arg0, arg1);
                data = arg2;                    
            } else {
                entity = new Entity(arg0);
                data = arg1;
            }
            this.set(entity, data);
            return entity;
        },
        // google's datastore doesn't like native arrays.
        // it needs a Collection for properties with
        // multiple values
        set: function(entity, data) {
            for (var i in data) {
                if (data[i] instanceof Array)
                    data[i] = java.util.Arrays.asList(data[i]);
                entity.setProperty(i, data[i]);
            }
        },
        // (key)
        // (entity) 
        // (kind, [opt] properties)
        // (kind, [opt] keyName/keyId, [opt] properties)
        put: function(arg0, arg1, arg2) {
            var entity = arg1 ? this.entity(arg0, arg1, arg2) : arg0;
            return this.datastore.put(entity);
        },
        // (key) 
        // (kind, [opt] keyId/keyName)
        get: function(arg0, arg1) {
            var key = arg1 ? KeyFactory.createKey(arg0, arg1) : arg0;
            return this.datastore.get(key);
        },
        // (key) 
        // (kind, [opt] keyId/keyName)
        del: function(arg0, arg1) {
            var key = arg1 ? KeyFactory.createKey(arg0, arg1) : arg0;
            this.datastore["delete"](key);
        },
        query: function(kind) {
            var q = new Query(kind);
            var options = FetchOptions.Builder.withDefaults();
            var self;
            function filter(propertyName, operator, value) {
                operator = filterOperators[operator] || operator;
                q.addFilter(propertyName, Query.FilterOperator[operator], value);
                return self;
            }
            function sort(propertyName, direction) {
                direction = sortDirections[direction||"ASC"] || direction;
                q.addSort(propertyName, Query.SortDirection[direction]);
                return self;
            }
            function limit(n) {
                options = options.limit(n);
                return self;
            }
            function offset(n) {
                options = options.offset(n);
                return self;
            }
            function fetch(n) {
                if (n) limit(n);
                var preparedQuery = googlestore.datastore.prepare(q);
                return preparedQuery.asList(options).toArray();
            }
            function count() {
                var preparedQuery = googlestore.datastore.prepare(q);
                return preparedQuery.countEntities(options);
            }
            self = {
                filter : filter,
                sort   : sort,
                limit  : limit,
                offset : offset,
                fetch  : fetch,
                count  : count
            };
            return self;
        },
        // abstracting everything as possible
        createKey: function(kind, id) {
            return KeyFactory.createKey(kind, id);
        }
    };
})();