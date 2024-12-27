from rest_framework.response import Response
from core.rest_response_renderer import CustomJSONRenderer

def _prepare_response(response):
    """Helper function to prepare response with renderer"""
    response.accepted_renderer = CustomJSONRenderer()
    response.accepted_media_type = "application/json"
    response.renderer_context = {}
    response.render()
    return response

def success_response(data, message=None, status_code=200):
    response = Response(data, status=status_code)
    response.message = message
    return _prepare_response(response)

def error_response(data, message, status_code=400):
    response = Response(data, status=status_code)
    response.message = message
    return _prepare_response(response)

def redirect_response(data, message=None, status_code=302):
    response = Response(data, status=status_code)
    response.message = message
    return _prepare_response(response)