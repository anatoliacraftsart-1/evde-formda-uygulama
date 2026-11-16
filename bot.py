import os
import requests
import re
from urllib.parse import quote

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = "8875880423"

# Saha ve fiziksel iş odaklı İngilizce & Almanca kelimeler
TARGET_KEYWORDS = [
    "courier", "delivery", "driver", "rider", "kurier", "fahrer", "zusteller", "auslieferungsfahrer", "paketbote",
    "warehouse", "logistics", "picker", "packer", "lager", "lagerhelfer", "kommissionierer", "logistik",
    "trainer", "fitness", "coach", "gym", "fitnesstrainer", "personal trainer"
]

# Yurt dışından başvuru / vize sponsorluğu sinyali veren kelimeler
VISA_KEYWORDS = [
    "visa", "sponsorship", "relocation", "international", "visum", "arbeitsvisum", "ausbildung", "eu blue card", "abroad"
]

# Sadece yerel vatandaş/oturum izni şartı koşan ilanları eleyen kelimeler
LOCAL_ONLY_KEYWORDS = [
    "us citizen", "green card", "security clearance", "no sponsorship", "must be authorized to work", "kein visum"
]

EXCLUDE_KEYWORDS = [
    "software", "developer", "engineer", "manager", "product", "sales", "marketing", "data", "account", "intern"
]

TARGET_LOCATIONS = [
    "germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "frankfurt", "cologne", "köln", "stuttgart", "düsseldorf",
    "united states", "usa", "new york", "california", "texas", "florida", "chicago", "los angeles", "new jersey"
]

# LinkedIn'de hem normal hem de vize sponsorluklu aramalar
LINKEDIN_QUERIES = [
    ("courier delivery driver visa sponsorship", "Germany"),
    ("warehouse logistics visa sponsorship", "Germany"),
    ("courier delivery driver", "Germany"),
    ("warehouse lager", "Germany"),
    ("fitness trainer", "Germany"),
    ("warehouse logistics visa sponsorship", "United States"),
    ("courier delivery driver", "United States"),
    ("personal trainer fitness", "United States")
]

def translate_to_turkish(text):
    if not text:
        return text
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q={quote(text)}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            return "".join([part[0] for part in data[0] if part[0]])
    except Exception as e:
        print(f"Çeviri hatası: {e}")
    return text

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
                    "description": item.get("description", ""),
                    "location": item.get("location", ""),
                    "url": item.get("url", ""),
                    "visa_api": item.get("visa_sponsorship", False),
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
                        "description": keyword,
                        "location": l.strip(),
                        "url": clean_url,
                        "visa_api": "visa" in keyword.lower(),
                        "source": "LinkedIn"
                    })
        except Exception as e:
            print(f"LinkedIn hatası ({keyword} - {country}): {e}")
    return jobs

def check_jobs():
    print("\n[Bilgi] Yurt dışı başvurusu ve vize filtreli saha ilanları taranıyor...")
    
    all_jobs = fetch_arbeitnow() + fetch_linkedin()
    visa_jobs_text = ""
    standard_jobs_text = ""
    total_found = 0
    seen_urls = set()

    for job in all_jobs:
        if job["url"] in seen_urls:
            continue
        seen_urls.add(job["url"])

        title_lower = job["title"].lower()
        desc_lower = job.get("description", "").lower()
        location_lower = job["location"].lower()
        combined_text = f"{title_lower} {desc_lower}"

        # Sadece yerel vatandaş şartı varsa doğrudan ele
        if any(local_kw in combined_text for local_kw in LOCAL_ONLY_KEYWORDS):
            continue

        location_match = any(loc in location_lower for loc in TARGET_LOCATIONS)
        keyword_match = any(kw in title_lower for kw in TARGET_KEYWORDS)
        is_excluded = any(ex in title_lower for ex in EXCLUDE_KEYWORDS)

        if location_match and keyword_match and not is_excluded:
            total_found += 1
            tr_title = translate_to_turkish(job["title"])
            tr_location = translate_to_turkish(job["location"])

            # Vize sponsorluğu / Yurt dışı alım kontrolü
            has_visa = job.get("visa_api") or any(v_kw in combined_text for v_kw in VISA_KEYWORDS)

            entry = (
                f"• *{tr_title}*\n"
                f"  _(Orijinal: {job['title']})_\n"
                f"  📍 {tr_location} - _{job['source']}_\n"
                f"  [İlana Git]({job['url']})\n\n"
            )

            if has_visa:
                visa_jobs_text += entry
            else:
                standard_jobs_text += entry

    if total_found > 0:
        message = f"🎯 *Yeni Saha İşi Bulundu!* ({total_found} Adet)\n\n"
        if visa_jobs_text:
            message += f"🛂 *TÜRKİYE'DEN BAŞVURU / VİZE SPONSORLUĞU AÇIK:*\n{visa_jobs_text}"
        if standard_jobs_text:
            message += f"⚠️ *DİĞER İLANLAR (Çalışma İzni Şartını Kontrol Et):*\n{standard_jobs_text}"
        
        send_telegram_notification(message[:4000])
    else:
        print("Yeni ilan yok.")
        send_telegram_notification("🤖 *İş Botu Çalıştı (Vize Filtreli):* Yeni ilan yok, sistem aktif.")

if __name__ == "__main__":
    check_jobs()
