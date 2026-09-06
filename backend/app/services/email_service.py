"""
Email Service - Disabled.
Mailing system has been completely decommissioned.
The application operates with 1 fixed Administrator and 1 fixed Editor account.
"""

from typing import Dict, Any, Optional


def send_password_setup_email(*args, **kwargs) -> Dict[str, Any]:
    """No-op stub in case of legacy references."""
    return {
        "sent": False,
        "simulated": False,
        "message": "Email system is completely disabled.",
    }



