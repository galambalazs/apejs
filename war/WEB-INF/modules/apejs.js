importPackage(java.io);

var apejs = {
    urls: {},
    run: function(request, response) {
        var path = request.getPathInfo();
        var httpMethod = request.getMethod().toLowerCase();

        // before running the http verb method run the before handler
        if (typeof this.before == "function") {
            this.before(request, response);
        }

        for (var i in this.urls) {
            var regex = "^"+i+"/?$";
            var matches = path.match(new RegExp(regex));
            if (matches && matches.length) {
                this.urls[i][httpMethod](request, response, matches);
                return; // we found it, stop searching
            }
        }
        
        // there was no matching url
        // try accessing static content inside APP_PATH/public
        try {
            // FIXME - this is really ugly - find other way to get servlet Context
            var mimeType = ApeServlet.CONFIG.getServletContext().getMimeType(path);
            var resPath = ApeServlet.APP_PATH+"/public"+path;
            var res = new File(resPath);
            // create an array of bytes as big as the file
            var b = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, res.length()); 
            var fileInputStream = new FileInputStream(res);
            // read file contents into byte array
            fileInputStream.read(b);

            response.setContentType(mimeType);
            response.getOutputStream().write(b);
        } catch (e) {
            // send 404
            response.sendError(response.SC_NOT_FOUND);
        }
    }
};
