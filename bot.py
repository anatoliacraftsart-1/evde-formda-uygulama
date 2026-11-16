import os
import requests
import re
import html
import json
import subprocess
from urllib.parse import quote

TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = "8875880423"
MEMORY_FILE = "sent_jobs.json"

TARGET_KEYWORDS = [
    "courier", "delivery", "driver", "rider", "kurier", "fahrer", "zusteller", "auslieferungsfahrer", "paketbote",
    "warehouse", "logistics", "picker", "packer", "lager", "lagerhelfer", "kommissionierer", "logistik",
    "trainer", "fitness", "coach", "gym", "fitnesstrainer", "personal trainer"
]

VISA_KEYWORDS = [
    "visa", "sponsorship", "relocation", "international", "visum", "arbeitsvisum", "ausbildung", "eu blue card", "abroad"
]

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

def load_memory():
    """Daha önce gönderilmiş ilanların URL'lerini yükler."""
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception as e:
            print(f"Hafıza okuma hatası: {e}")
    return set()

def save_memory(sent_urls):
    """Gönderilen ilanları hafıza dosyasına kaydeder ve GitHub'a otomatik commit eder."""
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(list(sent_urls), f, ensure_ascii=False, indent=2)
        
        # GitHub Actions ortamında hafızayı repoya kaydet
        subprocess.run(["git", "config", "--global", "user.name", "JobBot[bot]"], check=True)
        subprocess.run(["git", "config", "--global", "user.email", "bot@users.noreply.github.com"], check=True)
        subprocess.run(["git", "add", MEMORY_FILE], check=True)
        subprocess.run(["git", "commit", "-m", "Update job bot memory [skip ci]"], check=True)
        
        repo = os.environ.get("GITHUB_REPOSITORY")
        token = os.environ.get("GITHUB_TOKEN")
        if repo and token:
            remote_url = f"https://x-access-token:{token}@github.com/{repo}.git"
            # Hangi branch'te çalışıyorsa ona push eder
            branch = os.environ.get("GITHUB_REF_NAME", "main")
            subprocess.run(["git", "push", remote_url, f"HEAD:{branch}"], check=True)
            print("[Hafıza] Gönderilen ilanlar GitHub deposuna kaydedildi.")
    except Exception as e:
        print(f"Hafıza kaydetme/git push hatası: {e}")

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
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print("[Telegram Mesajı Gönderildi]")
        else:
            print(f"HTML gönderim hatası ({response.text}), düz metin deneniyor...")
            clean_text = re.sub(r'<[^>]+>', '', message)
            fallback_payload = {
                "chat_id": CHAT_ID,
                "text": clean_text,
                "disable_web_page_preview": True
            }
            requests.post(url, json=fallback_payload, timeout=10)
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
                raw_html = res.text
                titles = re.findall(r'<h3 class="base-search-card__title">\s*(.*?)\s*</h3>', raw_html, re.DOTALL)
                locations = re.findall(r'<span class="job-search-card__location">\s*(.*?)\s*</span>', raw_html, re.DOTALL)
                links = re.findall(r'<a class="base-card__full-link[^"]*" href="([^"]+)"', raw_html)
                
                for t, l, u in zip(titles, locations, links):
                    clean_url = u.split("?")[0]
                    jobs.append({
                        "title": html.unescape(t.strip()),
                        "description": keyword,
                        "location": html.unescape(l.strip()),
                        "url": clean_url,
                        "visa_api": "visa" in keyword.lower(),
                        "source": "LinkedIn"
                    })
        except Exception as e:
            print(f"LinkedIn hatası ({keyword} - {country}): {e}")
    return jobs

def check_jobs():
    print("\n[Bilgi] Hafıza destekli vize ve saha ilanları taranıyor...")
    
    sent_urls = load_memory()
    all_jobs = fetch_arbeitnow() + fetch_linkedin()
    
    visa_jobs_list = []
    standard_jobs_list = []
    new_urls_to_save = set()

    for job in all_jobs:
        job_url = job["url"]
        # Daha önce gönderildiyse tamamen atla
        if job_url in sent_urls:
            continue

        title_lower = job["title"].lower()
        desc_lower = job.get("description", "").lower()
        location_lower = job["location"].lower()
        combined_text = f"{title_lower} {desc_lower}"

        if any(local_kw in combined_text for local_kw in LOCAL_ONLY_KEYWORDS):
            continue

        location_match = any(loc in location_lower for loc in TARGET_LOCATIONS)
        keyword_match = any(kw in title_lower for kw in TARGET_KEYWORDS)
        is_excluded = any(ex in title_lower for ex in EXCLUDE_KEYWORDS)

        if location_match and keyword_match and not is_excluded:
            has_visa = job.get("visa_api") or any(v_kw in combined_text for v_kw in VISA_KEYWORDS)
            
            # Yeni bulunan ilanı listeye ekle ve hafızaya alınacaklar kümesine kaydet
            new_urls_to_save.add(job_url)
            if has_visa:
                visa_jobs_list.append(job)
            else:
                standard_jobs_list.append(job)

    total_found = len(visa_jobs_list) + len(standard_jobs_list)

    if total_found > 0:
        message = f"🎯 <b>Yeni Saha İşi Bulundu!</b> (Toplam {total_found} Adet)\n\n"
        
        if visa_jobs_list:
            message += "🛂 <b>TÜRKİYE'DEN BAŞVURU / VİZE SPONSORLUĞU AÇIK:</b>\n"
            for job in visa_jobs_list[:6]:
                tr_title = html.escape(translate_to_turkish(job["title"]))
                orig_title = html.escape(job["title"])
                tr_loc = html.escape(translate_to_turkish(job["location"]))
                message += f"• <b>{tr_title}</b>\n  <i>(Orijinal: {orig_title})</i>\n  📍 {tr_loc} - {job['source']}\n  <a href='{job['url']}'>İlana Git</a>\n\n"

        if standard_jobs_list:
            message += "⚠️ <b>DİĞER İLANLAR (Çalışma İzni Şartını Kontrol Et):</b>\n"
            for job in standard_jobs_list[:6]:
                tr_title = html.escape(translate_to_turkish(job["title"]))
                orig_title = html.escape(job["title"])
                tr_loc = html.escape(translate_to_turkish(job["location"]))
                message += f"• <b>{tr_title}</b>\n  <i>(Orijinal: {orig_title})</i>\n  📍 {tr_loc} - {job['source']}\n  <a href='{job['url']}'>İlana Git</a>\n\n"

        send_telegram_notification(message[:4000])
        
        # Gönderilen yeni ilanları hafızaya ekle ve kaydet
        sent_urls.update(new_urls_to_save)
        save_memory(sent_urls)
    else:
        print("Yeni ve daha önce gönderilmemiş ilan yok.")
        send_telegram_notification("🤖 <b>İş Botu Çalıştı (Hafızalı):</b> Yeni ve eşsiz ilan yok, sistem aktif.")

if __name__ == "__main__":
    check_jobs()
