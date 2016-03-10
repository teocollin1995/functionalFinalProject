import string
import json
import logging
import numpy as np
import flask
"""`main` is the top level module for your Flask application."""

# Import the Flask Framework
from flask import Flask
app = Flask(__name__)
# Note: We don't need to call run() since our application is embedded within
# the App Engine WSGI application server.

from datetime import timedelta
from flask import make_response, request, current_app
from functools import update_wrapper


def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator


@app.route('/')
@crossdomain(origin='*')
def hello():
    allcomp = dict()
    allcomp['hi'] = "hello world"
    return flask.jsonify(**allcomp) 

    """Return a friendly HTTP greeting."""
    return 'Hello World!'


def wolframalphaVector(eig,vec = True):
    logging.info("pre stringed")
    logging.info(str(eig))
    if vec:
        cstred = map(lambda x: str(x).replace('j','i').replace('(','').replace(')',''),eig.tolist())
        logging.info("stringed:")
        logging.info(str(cstred))
        return (cstred)
    else:
        cstred = map(lambda x: map(lambda y: str(y).replace('j','i').replace('(','').replace(')',''),x),eig.tolist())
        logging.info("stringed:")
        logging.info(str(cstred))
        return (cstred)
        
        
    # cstred = np.vectorize(str)(eig)
    # logging.info("stringed:")
    # logging.info(str(cstred))
    # return (np.ndarray.tolist(cstred))
    



@app.route('/eigen/<matrix>')
@crossdomain(origin='*')
def eigen(matrix):
    logging.info("Matrix:")
    logging.info(str((matrix.encode('ascii','ignore'))))
    temp = ((matrix.encode('ascii','ignore')))
    cmatrix = eval(eval(temp))
    logging.info(str(type(cmatrix)))
    grr = []
    #return (str(len(cmatrix)))
    for x in range(0,len(cmatrix)):
        one = []
        for y in range(0,len(cmatrix[0])):
            one.append(cmatrix[x][y])
        grr.append(one)

    #return(str(grr))
    npa = np.vectorize(np.complex)(np.array(grr))
    
    eig = np.linalg.eig(npa)
    #return(wolframalphaVector(eig[0]))
    #return str(eigen)
    # #return str(npa.ndim)
    # logging.info(str(type(npa)))
    
    # return (np.array_str(npaa))
    
    
    # npa = (np.array(cmatrix))
    # return npa
    allcomp = dict()
    allcomp['real'] = str(eig)
    allcomp['org'] = matrix
    allcomp['converted'] = str(npa)
    
    eigvalues = (wolframalphaVector(eig[0]))
    eigenvectors = wolframalphaVector(eig[1],False)
    logging.info(str(eigenvectors))
    allcomp['vector'] = eigenvectors
    allcomp['val'] = eigvalues
    return flask.jsonify(**allcomp) #https://stackoverflow.com/questions/13081532/how-to-return-json-using-flask-web-framework
    

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500
