from rest_framework.renderers import JSONRenderer

class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        status = False
        if str(renderer_context["response"].status_code)[0] == '2':
            status = True

        response_data = {
            "message": renderer_context["response"].status_text,
            "data": data,
            "status_code": renderer_context["response"].status_code,
            "status": status,
        }
        return super().render(response_data, accepted_media_type, renderer_context)