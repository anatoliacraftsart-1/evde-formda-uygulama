import os
import requests

# Telegram Bilgilerin Tanımlandı
TELEGRAM_TOKEN = "9139035442:AAHQtetUhGZZq3jFU4EhhVRdnFXOUh2KskW"
CHAT_ID = "8875880423"

TARGET_KEYWORDS = ["warehouse", "trainer", "delivery", "courier"]
TARGET_COUNTRIES = ["Germany", "United States", "Deutschland", "USA"]

def send_telegram_notification(message):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": CHAT_ID,
            "text": message,
            "parse_mode": "Markdown"
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print("[Telegram Mesajı Gönderildi]")
        else:
            print(f"Telegram hatası: {response.text}")
    except Exception as e:
        print(f"Telegram gönderme hatası: {e}")

def check_jobs():
    print("\n[Bilgi] Almanya ve ABD için iş ilanları taranıyor...")
    url = "https://www.arbeitnow.com/api/job-board-api"
    
    found_jobs_text = ""
    new_jobs_found = 0

    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print("API yanıt vermedi.")
            send_telegram_notification("⚠️ *İş Botu Uyarısı:* Arbeitnow API yanıt vermedi.")
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
                found_jobs_text += f"• *{job.get('title')}* ({job.get('location')})\n  [İlana Git]({job_url})\n\n"

        if new_jobs_found > 0:
            message = f"🎯 *Yeni İş İlanı Bulundu!* ({new_jobs_found} Adet)\n\n{found_jobs_text}"
            send_telegram_notification(message)
        else:
            print("Yeni ilan yok.")
            send_telegram_notification("🤖 *İş Botu Çalıştı:* Yeni ilan yok, sistem aktif ve çalışıyor.")

    except Exception as e:
        error_msg = f"❌ *Tarama Hatası:* {e}"
        print(error_msg)
        send_telegram_notification(error_msg)

if __name__ == "__main__":
    check_jobs()
