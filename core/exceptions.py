from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the custom format
    if response is not None:
        custom_data = {
            'error': True,
            'status_code': response.status_code,
            'message': 'An error occurred',
            'details': response.data
        }

        # If standard DRF validation error, format it nicer
        if isinstance(response.data, dict) and 'detail' in response.data:
            custom_data['message'] = response.data['detail']
            del response.data['detail']

        # Update the response data
        response.data = custom_data
    
    # If response is None, it means an unhandled exception occurred.
    # We could optionally handle that here by returning a custom 500 Response.
    # But standard DRF behavior lets Django handle 500s.

    return response
