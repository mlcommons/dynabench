import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from string import Template


from string import Template

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import pathlib

class Email:
    def __init__(self):
        self.local_dir = pathlib.Path(__file__).parent

    def _read_template(self, filename):
        """
        Returns a Template object comprising the contents of the
        file specified by filename.
        """
        
        file_path = "templates/{}".format(filename)
        template_path = self.local_dir / file_path

        with open(template_path, encoding="utf-8") as template_file:
            template_file_content = template_file.read()
        return Template(template_file_content)



    def send(
        self, contact, cc_contact=None, template_name="", msg_dict={}, subject=""
    ):
        login = "dynabench-site@mlcommons.org"
        pwd = "pcobtnfznqmlinpl"
        
        try:
            msg = MIMEMultipart()
            message_template = self._read_template(template_name)
            message = message_template.substitute(msg_dict)
            msg["From"] = login
            msg["To"] = contact
            if cc_contact is not None:
                msg["Cc"] = cc_contact
            msg.set_charset("utf-8")
            msg["Subject"] = subject
            msg.attach(MIMEText(message, "plain"))
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.ehlo()
            server.starttls()
            server.login(login, pwd)
            server.sendmail(login, contact, msg.as_string())
            server.close()
            print("e-mail sended to {}".format(contact))
            return True

        except Exception:
            print("Error sending e-mail")
            return False

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
import smtplib


def send_email(subject, body,send_to):
    login = "dynabench-site@mlcommons.org"
    pwd = "pcobtnfznqmlinpl"
    msg = MIMEMultipart()
    msg["From"] = login
    msg["To"] = send_to
    msg.set_charset("utf-8")
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.ehlo()
    server.starttls()
    server.login(login, pwd)
    server.sendmail(login, send_to, msg.as_string())
    server.close()

