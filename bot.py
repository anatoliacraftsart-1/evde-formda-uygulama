import os
import requests

# Token güvenli şekilde GitHub Secrets üzerinden okunur
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = "8875880423"

# İngilizce ve Almanca genişletilmiş anahtar kelimeler
TARGET_KEYWORDS = [
    # Depo / Lojistik
    "warehouse", "logistics", "lager", "lagerhelfer", "kommissionierer",
    # Kurye / Teslimat / Sürücü
    "delivery", "courier", "driver", "kurier", "fahrer", "zusteller", "auslieferungsfahrer",
    # Fitness / Antrenör
    "trainer", "fitness", "coach", "fitnesstrainer", "personal trainer"
]

# Ülkeler ve büyük şehirler
TARGET_LOCATIONS = [
    "germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "köln", "stuttgart",
    "united states", "usa", "new york", "california", "texas", "florida", "chicago", "los angeles"
]

def send_telegram_notification(message):
    if not TELEGRAM_TOKEN:
        print("Hata: TELEGRAM_TOKEN bulunamadı!")
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": CHAT_ID,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True
        }
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print("[Telegram Mesajı Gönderildi]")
        else:
            print(f"Telegram hatası: {response.text}")
    except Exception as e:
        print(f"Telegram gönderme hatası: {e}")

def fetch_arbeitnow():
    jobs = []
    try:
        res = requests.get("https://www.arbeitnow.com/api/job-board-api", timeout=10)
        if res.status_code == 200:
            for item in res.json().get("data", []):
                jobs.append({
                    "title": item.get("title", ""),
                    "location": item.get("location", ""),
                    "url": item.get("url", ""),
                    "source": "Arbeitnow"
                })
    except Exception as e:
        print(f"Arbeitnow hatası: {e}")
    return jobs

def fetch_remotive():
    jobs = []
    try:
        res = requests.get("https://remotive.com/api/remote-jobs", timeout=10)
        if res.status_code == 200:
            for item in res.json().get("jobs", []):
                jobs.append({
                    "title": item.get("title", ""),
                    "location": item.get("candidate_required_location", ""),
                    "url": item.get("url", ""),
                    "source": "Remotive"
                })
    except Exception as e:
        print(f"Remotive hatası: {e}")
    return jobs

def fetch_jobicy():
    jobs = []
    try:
        res = requests.get("https://jobicy.com/api/v2/remote-jobs?count=50", timeout=10)
        if res.status_code == 200:
            for item in res.json().get("jobs", []):
                jobs.append({
                    "title": item.get("jobTitle", ""),
                    "location": item.get("jobGeo", ""),
                    "url": item.get("url", ""),
                    "source": "Jobicy"
                })
    except Exception as e:
        print(f"Jobicy hatası: {e}")
    return jobs

def check_jobs():
    print("\n[Bilgi] Almanya ve ABD için 3 farklı kaynaktan ilanlar taranıyor...")
    
    all_jobs = fetch_arbeitnow() + fetch_remotive() + fetch_jobicy()
    found_jobs_text = ""
    new_jobs_found = 0

    for job in all_jobs:
        title_lower = job["title"].lower()
        location_lower = job["location"].lower()

        location_match = any(loc in location_lower for loc in TARGET_LOCATIONS)
        keyword_match = any(kw in title_lower for kw in TARGET_KEYWORDS)

        if location_match and keyword_match:
            new_jobs_found += 1
            found_jobs_text += (
                f"• *{job['title']}* ({job['location']}) - _{job['source']}_\n"
                f"  [İlana Git]({job['url']})\n\n"
            )

    if new_jobs_found > 0:
        # Telegram mesaj karakter sınırını (4096) aşmamak için güvenli kesim
        message = f"🎯 *Yeni İş İlanı Bulundu!* ({new_jobs_found} Adet)\n\n{found_jobs_text}"[:4000]
        send_telegram_notification(message)
    else:
        print("Yeni ilan yok.")
        send_telegram_notification("🤖 *İş Botu Çalıştı (3 Kaynak):* Yeni ilan yok, sistem aktif ve çalışıyor.")

if __name__ == "__main__":
    check_jobs()
