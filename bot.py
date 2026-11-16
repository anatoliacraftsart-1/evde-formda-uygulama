import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests

# Doğrudan kimlik bilgileri (GitHub Secrets hatası yaşamamak için)
SENDER_EMAIL = "taniksiztarih@gmail.com"
SENDER_PASSWORD = "njpsmccmalimibog"  # 16 haneli uygulama şifren (boşluksuz)
RECEIVER_EMAIL = "taniksiztarih@gmail.com"

TARGET_KEYWORDS = ["warehouse", "trainer", "delivery", "courier"]
TARGET_COUNTRIES = ["Germany", "United States", "Deutschland", "USA"]

def send_email_notification(subject, body_text):
    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = RECEIVER_EMAIL
        msg["Subject"] = subject
        msg.attach(MIMEText(body_text, "plain", "utf-8"))

        # Port 465 ve SMTP_SSL kullanarak güvenli ve engellenmeyen bağlantı
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
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
                "⚠️ İş Botu Uyarısı: API Yanıt Vermedi",
                "GitHub Actions botu çalıştı ancak Arbeitnow API yanıt vermedi."
            )
            return

        data = response.json().get("data", [])
        
        for job in data:
            title = job.get("title", "").lower()
            location = job.get("location", "").lower()
            job_url = job.get("url", "")

            country_match = any(c.lower() in location for c in TARGET_COUNTRIES)
            keyword_match = any(k.lower() in title for k in TARGET_KEYWORDS)

            if country_match and keyword_match:
                new_jobs_found += 1
                found_jobs_text += f"- {job.get('title')} ({job.get('location')})\n  Link: {job_url}\n\n"

        if new_jobs_found > 0:
            subject = f"🎯 Yeni İş İlanı Bulundu! ({new_jobs_found} Adet)"
            body = f"Kriterlerinize uygun yeni ilanlar bulundu:\n\n{found_jobs_text}"
            send_email_notification(subject, body)
        else:
            print("Yeni ilan yok.")
            send_email_notification(
                "🤖 İş Botu Çalıştı: Yeni İlan Yok",
                "Bot taramayı tamamladı. Şu an kriterlerinize uygun yeni bir ilan bulunmuyor, sistem aktif ve çalışıyor."
            )

    except Exception as e:
        error_msg = f"Tarama sırasında hata oluştu: {e}"
        print(error_msg)
        send_email_notification("❌ İş Botu Hata Raporu", error_msg)

if __name__ == "__main__":
    check_jobs()
