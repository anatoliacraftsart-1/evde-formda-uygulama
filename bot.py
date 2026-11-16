import os
import requests
import re
from urllib.parse import quote

# Token güvenli şekilde GitHub Secrets üzerinden okunur
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = "8875880423"

# Saha ve fiziksel iş odaklı İngilizce & Almanca kelimeler
TARGET_KEYWORDS = [
    "courier", "delivery", "driver", "rider", "kurier", "fahrer", "zusteller", "auslieferungsfahrer", "paketbote",
    "warehouse", "logistics", "picker", "packer", "lager", "lagerhelfer", "kommissionierer", "logistik",
    "trainer", "fitness", "coach", "gym", "fitnesstrainer", "personal trainer"
]

EXCLUDE_KEYWORDS = [
    "software", "developer", "engineer", "manager", "product", "sales", "marketing", "data", "account", "intern"
]

TARGET_LOCATIONS = [
    "germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "köln", "stuttgart", "düsseldorf",
    "united states", "usa", "new york", "california", "texas", "florida", "chicago", "los angeles", "new jersey"
]

# LinkedIn'de doğrudan aranacak hedef kombinasyonlar
LINKEDIN_QUERIES = [
    ("courier delivery driver", "Germany"),
    ("warehouse lager", "Germany"),
    ("fitness trainer", "Germany"),
    ("courier delivery driver", "United States"),
    ("warehouse logistics", "United States"),
    ("personal trainer fitness", "United States")
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
                if item.get("remote") is True:
                    continue
                jobs.append({
                    "title": item.get("title", ""),
                    "location": item.get("location", ""),
                    "url": item.get("url", ""),
                    "visa": item.get("visa_sponsorship", False),
                    "source": "Arbeitnow"
                })
    except Exception as e:
        print(f"Arbeitnow hatası: {e}")
    return jobs

def fetch_linkedin():
    jobs = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    for keyword, country in LINKEDIN_QUERIES:
        try:
            # Son 24 saatte yayınlanan (f_TPR=r86400) yerinde (f_WT=1) ilanları çeker
            url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords={quote(keyword)}&location={quote(country)}&f_TPR=r86400&f_WT=1"
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                html = res.text
                titles = re.findall(r'<h3 class="base-search-card__title">\s*(.*?)\s*</h3>', html, re.DOTALL)
                locations = re.findall(r'<span class="job-search-card__location">\s*(.*?)\s*</span>', html, re.DOTALL)
                links = re.findall(r'<a class="base-card__full-link[^"]*" href="([^"]+)"', html)
                
                for t, l, u in zip(titles, locations, links):
                    clean_url = u.split("?")[0]
                    jobs.append({
                        "title": t.strip(),
                        "location": l.strip(),
                        "url": clean_url,
                        "visa": False,
                        "source": "LinkedIn"
                    })
        except Exception as e:
            print(f"LinkedIn hatası ({keyword} - {country}): {e}")
    return jobs

def check_jobs():
    print("\n[Bilgi] Arbeitnow ve LinkedIn üzerinden Almanya & ABD saha ilanları taranıyor...")
    
    all_jobs = fetch_arbeitnow() + fetch_linkedin()
    found_jobs_text = ""
    new_jobs_found = 0
    seen_urls = set()

    for job in all_jobs:
        if job["url"] in seen_urls:
            continue
        seen_urls.add(job["url"])

        title_lower = job["title"].lower()
        location_lower = job["location"].lower()

        location_match = any(loc in location_lower for loc in TARGET_LOCATIONS)
        keyword_match = any(kw in title_lower for kw in TARGET_KEYWORDS)
        is_excluded = any(ex in title_lower for ex in EXCLUDE_KEYWORDS)

        if location_match and keyword_match and not is_excluded:
            new_jobs_found += 1
            visa_tag = "🛂 *Vize Sponsorluğu!* | " if job.get("visa") else ""
            found_jobs_text += (
                f"• *{job['title']}* ({job['location']}) - _{job['source']}_\n"
                f"  {visa_tag}[İlana Git]({job['url']})\n\n"
            )

    if new_jobs_found > 0:
        # Telegram mesaj limitine takılmamak için ilk 15 ilanı temiz şekilde gösterir
        message = f"🎯 *Yeni Saha İşi Bulundu!* ({new_jobs_found} Adet)\n\n{found_jobs_text}"[:4000]
        send_telegram_notification(message)
    else:
        print("Yeni ilan yok.")
        send_telegram_notification("🤖 *İş Botu Çalıştı (LinkedIn + Arbeitnow):* Yeni ilan yok, sistem aktif.")

if __name__ == "__main__":
    check_jobs()
