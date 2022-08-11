# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import pathlib
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from string import Template

from dotenv import load_dotenv


class Email:
    def __init__(self):
        load_dotenv()

        self.login = os.getenv("MAIL_LOGIN")
        self.pwd = os.getenv("MAIL_PASWORD")

        self.local_dir = pathlib.Path(__file__).parent

    def _read_template(self, filename):
        """
        Returns a Template object comprising the contents of the
        file specified by filename.
        """

        file_path = f"templates/{filename}"
        template_path = self.local_dir / file_path

        with open(template_path, encoding="utf-8") as template_file:
            template_file_content = template_file.read()
        return Template(template_file_content)

    def send(self, contact, cc_contact=None, template_name="", msg_dict={}, subject=""):

        try:
            msg = MIMEMultipart()
            message_template = self._read_template(template_name)
            message = message_template.substitute(msg_dict)
            msg["From"] = self.login
            msg["To"] = contact
            if cc_contact is not None:
                msg["Cc"] = cc_contact
            msg.set_charset("utf-8")
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "plain"))
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.ehlo()
            server.starttls()
            server.login(self.login, self.pwd)
            server.sendmail(self.login, contact, msg.as_string())
            server.close()
            print(f"e-mail sended to {contact}")
            return True

        except Exception:
            print("Error sending e-mail")
            return False
