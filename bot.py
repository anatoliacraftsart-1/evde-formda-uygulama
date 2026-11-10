import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import requests

# GitHub Secrets üzerinden güvenli okuma
SENDER_EMAIL = os.environ.get("taniksiztarih@gmail.com")
SENDER_PASSWORD = os.environ.get("n j p s m c c m a l i m i b o g" \
"")
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


def send_email_notification(subject, body_text):
  try:
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = subject

    msg.attach(MIMEText(body_text, "plain"))

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(SENDER_EMAIL, SENDER_PASSWORD)
    server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
    server.quit()
    print("[E-posta Gönderildi]")
  except Exception as e:
    print(f"E-posta gönderme hatası: {e}")


def check_jobs():
  print("\n[Bilgi] Almanya ve ABD için iş ilanları taranıyor...")
  url = "https://www.arbeitnow.com/api/job-board-api"

  found_jobs_text = ""
  new_jobs_found = 0

  try:
    response = requests.get(url, timeout=10)
    if response.status_code != 200:
      print("API yanıt vermedi.")
      send_email_notification(
          "⚠️ İş Botu Uyarı: API Yanıt Vermedi",
          "GitHub Actions botu çalışt ancak Arbeitnow API yanıt vermedi.",
      )
      return

    data = response.json().get("data", [])

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
        found_jobs_text += (
            f"Pozisyon: {job.get('title')}\nLokasyon: {location}\nLink:"
            f" {job_url}\n\n--------------------\n"
        )
        print(f"-> Eşleşen İlan: {job.get('title')} ({location})")

    # İlan bulunsun veya bulunmasın HER ÇALIŞMADA mail atar
    if new_jobs_found > 0:
      subject = f"🎯 Yeni İş İlanı Bulundu ({new_jobs_found} adet)"
      body = f"Almanya veya ABD için kriterlerine uyan ilanlar:\n\n{found_jobs_text}"
    else:
      subject = "🤖 İş Botu Çalıştı: Yeni İlan Yok"
      body = (
          "Bot periyodik olarak tarama yaptı ancak kriterlerine uyan yeni bir"
          " ilan bulamadı. Sistem aktif ve sorunsuz çalışıyor."
      )

    send_email_notification(subject, body)
    print(f"[Tarama Tamamlandı] {new_jobs_found} yeni uygun ilan bulundu.")

  except Exception as e:
    error_msg = f"Tarama sırasında hata oluştu: {e}"
    print(error_msg)
    send_email_notification("❌ İş Botu Hata Raporu", error_msg)


if __name__ == "__main__":
  check_jobs()
