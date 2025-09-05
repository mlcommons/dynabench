# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import pathlib
import smtplib
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from string import Template

from dotenv import load_dotenv


load_dotenv()


class EmailHelper:
    def __init__(self):
        self.login = os.getenv("MAIL_LOGIN")
        self.pwd = os.getenv("MAIL_PASSWORD")
        self.port = os.getenv("SMTP_PORT")
        self.host = os.getenv("SMTP_HOST")

        self.local_dir = pathlib.Path(__file__).parent

    def _read_template(self, filename):
        """
        Returns a Template object comprising the contents of the
        file specified by filename.
        """

        file_path = f"email_templates/{filename}"
        template_path = self.local_dir / file_path

        with open(template_path, encoding="utf-8") as template_file:
            template_file_content = template_file.read()
        return Template(template_file_content)

    def send(
        self,
        contact: str,
        cc_contact: str = None,
        template_name: str = "",
        msg_dict: dict = {},
        subject: str = "",
        attachments=None,
    ):
        try:
            msg = MIMEMultipart()
            message_template = self._read_template(template_name)
            message = message_template.substitute(msg_dict)
            msg["From"] = self.login
            msg["To"] = contact
            if cc_contact:
                msg["Cc"] = cc_contact
            msg.set_charset("utf-8")
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "plain"))

            # Attach files if provided. Expected format: list of (filename, content)
            if attachments:
                for attachment in attachments:
                    try:
                        filename, content = attachment
                        if isinstance(content, str):
                            content = content.encode("utf-8")
                        part = MIMEApplication(content, _subtype="json")
                        part.add_header(
                            "Content-Disposition", "attachment", filename=filename
                        )
                        msg.attach(part)
                    except Exception as _:
                        print(f"Error attaching attachment {filename}: {_}")
                        continue
            server = smtplib.SMTP(self.host, self.port)
            server.ehlo()
            server.starttls()
            server.login(self.login, self.pwd)
            recipients = [contact]
            if cc_contact:
                recipients.append(cc_contact)
            server.sendmail(self.login, recipients, msg.as_string())
            server.close()
            return f"e-mail sended to {contact}"

        except Exception as e:
            print("Error sending e-mail")
            print(e)
            return False
