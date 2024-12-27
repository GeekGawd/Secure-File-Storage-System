# rest_response_renderer.py
from rest_framework.renderers import JSONRenderer

class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get("response")
        if not response:
            return super().render(data, accepted_media_type, renderer_context)

        status_code = response.status_code

        # Initialize default values
        status = False

        message = getattr(response, 'message', None)

        # Handle Success Responses (2XX)
        if 200 <= status_code < 300:
            message = message or "OK"
            status = True   

        # Handle Redirect Responses (3XX)
        elif 300 <= status_code < 400:
            message = message or "Redirection"
            response.status_code = 200
            status = True

        # Handle Client Errors (4XX)
        elif 400 <= status_code < 500:
            message = message or response.data.get("detail") or response.status_text

        # Handle other status codes if necessary
        else:
            message = message or response.status_text

        response_data = {
            "message": message,
            "data": data,
            "status_code": status_code,
            "status": status,
        }

        return super().render(response_data, accepted_media_type, renderer_context)
