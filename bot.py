import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import requests

# GitHub Secrets üzerinden güvenli okuma
SENDER_EMAIL = os.environ.get("taniksiztarih@gmail.com")
SENDER_PASSWORD = os.environ.get("n j p s m c c m a l i m i b o g")
RECEIVER_EMAIL = os.environ.get("taniksiztarih@gmail.com")

TARGET_KEYWORDS = [
    "warehouse",
    "logistics",
    "fulfillment",
    "delivery",
    "fitness",
    "trainer",
    "coach",
]
TARGET_COUNTRIES = ["Germany", "United States", "Deutschland"]


def send_email_notification(job_title, job_location, job_url):
  try:
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = f"🎯 Yeni İş İlanı (DE / US): {job_title}"

    body = f"""
    Almanya veya ABD için yeni bir iş ilanı bulundu!
    
    Pozisyon: {job_title}
    Lokasyon: {job_location}
    İlan Linki: {job_url}
    
    GitHub Actions Bulut Botu
    """
    msg.attach(MIMEText(body, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
    server.quit()
    print(f"[E-posta Gönderildi] {job_title}")
  except Exception as e:
    print(f"E-posta gönderme hatası: {e}")


def check_jobs():
  print("\n[Bilgi] Almanya ve ABD için iş ilanları taranıyor...")
  url = "https://www.arbeitnow.com/api/job-board-api"

  try:
    response = requests.get(url, timeout=10)
    if response.status_code != 200:
      print("API yanıt vermedi.")
      return

    data = response.json().get("data", [])
    new_jobs_found = 0

    for job in data:
      title = job.get("title", "").lower()
      location = job.get("location", "")
      job_url = job.get("url", "")

      keyword_match = any(kw in title for kw in TARGET_KEYWORDS)
      location_match = any(
          country.lower() in location.lower() for country in TARGET_COUNTRIES
      )

      if keyword_match and location_match:
        new_jobs_found += 1
        print(f"-> Eşleşen İlan: {job.get('title')} ({location})")
        send_email_notification(job.get("title"), location, job_url)

    print(f"[Tarama Tamamlandı] {new_jobs_found} yeni uygun ilan bulundu.")

  except Exception as e:
    print(f"Tarama sırasında hata oluştu: {e}")


if __name__ == "__main__":
  check_jobs()