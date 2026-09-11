"""Create three printable A4 PDFs from the exact browser card definitions."""
from pathlib import Path
import json, subprocess, math, sys
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {STARTER,MONSTERS,BOSS_THREATS} from './dist/data.mjs'; console.log(JSON.stringify({STARTER,MONSTERS,BOSS_THREATS}));"], cwd=ROOT, encoding='utf-8'))
font_dir = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Body', str(font_dir/'arial.ttf')))
pdfmetrics.registerFont(TTFont('Bold', str(font_dir/'arialbd.ttf')))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold')
INK = colors.HexColor('#17272d')
GREY = colors.HexColor('#526065')
LINE = colors.HexColor('#aeb7ba')
PALE = colors.HexColor('#edf0f0')
LABEL = {'attack':'Attack', 'block':'Block', 'heal':'Heal'}

def text(c,x,y,s,size=10,font='Body',color=INK):
    c.setFillColor(color); c.setFont(font,size); c.drawString(x,y,str(s))

def para(c,x,y,s,width,size=10,leading=None):
    style=ParagraphStyle('p',fontName='Body',fontSize=size,leading=leading or size*1.4,textColor=INK)
    p=Paragraph(s,style); _,height=p.wrap(width,1000); p.drawOn(c,x,y-height); return y-height

def heading(c,title,sub,page,total,size=A4):
    w,h=size
    text(c,14*mm,h-17*mm,'DUNGEON ROW',10,'Bold')
    text(c,14*mm,h-29*mm,title,23,'Bold')
    text(c,14*mm,h-37*mm,sub,9,color=GREY)
    c.setStrokeColor(LINE);c.line(14*mm,15*mm,w-14*mm,15*mm)
    text(c,14*mm,10*mm,'Prototype 0.1.0 | GDD v1.3 | Manuelle tests er endnu ikke gennemført',8,color=GREY)
    c.setFont('Body',8);c.drawRightString(w-14*mm,10*mm,f'{page} / {total}')

def lines(c,x,y,width,count=3,step=8*mm):
    c.setStrokeColor(LINE);c.setLineWidth(.5)
    for i in range(count):c.line(x,y-i*step,x+width,y-i*step)
    return y-count*step

def effects_str(effects,up=False):
    return ' / '.join(f"{LABEL[e['type']]} {e['value']+(1 if up and i==0 else 0)}" for i,e in enumerate(effects))

def effect_boxes(c,x,y,width,effects,up=False):
    gap=5;bw=(width-gap*(len(effects)-1))/len(effects)
    for i,e in enumerate(effects):
        bx=x+i*(bw+gap);c.setStrokeColor(LINE);c.setFillColor(PALE);c.roundRect(bx,y,bw,47,4,fill=1,stroke=1)
        text(c,bx+8,y+32,LABEL[e['type']],9,'Bold')
        text(c,bx+8,y+8,e['value']+(1 if up and i==0 else 0),23,'Bold')

def card(c,x,y,w,h,record):
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.setDash(2,2);c.rect(x,y,w,h,fill=0,stroke=1);c.setDash()
    pad=10;left=x+pad;top=y+h-pad;inner=w-2*pad
    kind=record['kind']
    category={'starter':'STARTERKORT','monster':f"MONSTER / FLOOR {record.get('floor','')}",'boss':'BOSS / GRAVEKEEPER','loot':'LOOT / '+('PERFECT' if record.get('up') else 'NORMAL'),'blank':'RESERVEKORT'}[kind]
    text(c,left,top-7,category,8,'Bold',GREY)
    name=record.get('name','')
    para(c,left,top-20,name,inner,15,18)
    c.setStrokeColor(LINE);c.line(left,top-63,x+w-pad,top-63)
    if kind in ('monster','boss'):
        text(c,left,top-116,record['threat'],39,'Bold')
        text(c,left+56,top-98,'THREAT',8,'Bold',GREY)
        if kind=='monster':
            text(c,left,y+82,'LOOT VED KILL',8,'Bold',GREY)
            para(c,left,y+74,record['loot'],inner,11,14)
            para(c,left,y+52,effects_str(record['effects']),inner,10,13)
            para(c,left,y+29,'Perfect: '+effects_str(record['effects'],True),inner,9,12)
        else:
            text(c,left,y+78,f"Stage {record['stage']} af 3",13,'Bold')
            text(c,left,y+52,'Ingen loot',10)
            text(c,left,y+34,'Kan ikke Endures',10)
    elif kind in ('starter','loot'):
        effect_boxes(c,left,y+50,inner,record['effects'],record.get('up',False))
        text(c,left,y+23,'DUNGEON ROW',8,'Bold',GREY)
    else:
        lines(c,left,y+115,inner,4,23)

def print_cards():
    records=[]
    for d in data['STARTER']:
        records += [dict(d,kind='starter') for _ in range(d['count'])]
    for d in data['MONSTERS']:
        records += [dict(d,kind='monster') for _ in range(d['count'])]
    for i,n in enumerate(data['BOSS_THREATS'],1):
        records.append(dict(kind='boss',name='Gravekeeper',threat=n,stage=i))
    for up in [False,True]:
        for d in data['MONSTERS']:
            records += [dict(kind='loot',name=d['loot'],effects=d['effects'],up=up) for _ in range(d['count'])]
    records += [dict(kind='blank') for _ in range(2)]
    assert len(records)==90
    path=OUT/'Dungeon Row - Printkort.pdf';c=canvas.Canvas(str(path),pagesize=A4)
    c.setTitle('Dungeon Row - Printkort, GDD v1.3');c.setAuthor('Dungeon Row')
    w,h=A4;gap=4*mm;cw=(w-24*mm-2*gap)/3;ch=80*mm
    for page in range(10):
        text(c,12*mm,h-14*mm,'DUNGEON ROW / PRINTKORT',12,'Bold')
        text(c,12*mm,h-21*mm,'Print A4 i 100 %, enkeltsidet. Klip langs de stiplede linjer.',8,color=GREY)
        for i,r in enumerate(records[page*9:(page+1)*9]):
            x=12*mm+(i%3)*(cw+gap);y=h-29*mm-(i//3)*(ch+gap)-ch
            card(c,x,y,cw,ch,r)
        text(c,12*mm,10*mm,f'GDD v1.3 | 10 starterkort + 25 monstre + 3 stages + 50 loot + 2 reserve | {page+1}/10',8,color=GREY)
        c.showPage()
    c.save();return path

def guide():
    path=OUT/'Dungeon Row - Turguide og spillebord.pdf';c=canvas.Canvas(str(path),pagesize=A4)
    c.setTitle('Dungeon Row - Turguide og spillebord');w,h=A4
    heading(c,'Klar til første run','Opsætning og turguide til papirprototypen',1,3)
    y=h-49*mm
    y=para(c,14*mm,y,'<b>1. Find materialerne</b><br/>Printkort, spillebord (side 3), testark, blyant og tællere. Brug terninger eller små sedler til aktuel Threat. Loot-kortene indeholder både normale og opgraderede kopier til alle 25 monstre.',182*mm)
    y=para(c,14*mm,y-6*mm,'<b>2. Lav bunker og række</b><br/>HP = max-HP = 20. Bland de 10 starterkort. Bland monsterkort inden for hver floor, og stak floor 1 over 2 over 3. Læg de tre boss-stages separat i rækkefølge. Fyld fire faste pladser fra venstre. Gem loot som en separat bank.',182*mm)
    y=para(c,14*mm,y-6*mm,'<b>3. Spil uden Scrap i de første tre runs</b><br/>Loot er obligatorisk ved kill og går i discard. Monstre og kort kan gentages. Et monsters aktuelle Threat ændrer aldrig tallene på dets normale loot.',182*mm)
    y-=9*mm;text(c,14*mm,y,'TUREN',12,'Bold');y-=6*mm
    steps=[
      ('Draw 4','Bland discard til en ny draw-bunke, når draw løber tør. Kan du ikke trække fire, spiller du med færre. Hånden fyldes ikke op senere på turen.'),
      ('Tildel','Hvert tal bruges separat. Attack rammer ét monster; Block og Heal rammer dig. Tal må stå ubrugte. Alt kan fortrydes før End Turn.'),
      ('Resolve','Fjern eventuelt Scrap uden effekt. Heal først, op til max-HP. Derefter kills: Attack mindst lig med Threat dræber. Præcis lig giver Perfect-loot (første tal +1). Overskydende Attack overføres ikke.'),
      ('Angreb','Stærkeste overlevende angriber; ved lighed vælges den længst til venstre. Skade = max(0, Threat - Block). Block forsvinder. HP på 0 eller mindre giver straks død.'),
      ('Endure / Leave','Kun angriberen kan Endures: fjern den uden loot. Leave beholder den. Bossen bliver automatisk. Hvis ingen fjender overlever, springes angreb og valg over.'),
      ('Eskalering og Refill','Alle overlevende får +1 Threat. Indsæt en ventende boss-stage, og fyld ellers tomme pladser fra venstre. Nye monstre står med trykt Threat. Hånden går i discard.')]
    for title,body in steps:
        y=para(c,14*mm,y,f'<b>{title}.</b> {body}',182*mm,9.5,13.1)-5*mm
    assert y>20*mm,(y,'guide overflow')
    c.showPage()
    heading(c,'Det, der let bliver glemt','Bossen, Scrap og et konkret eksempel',2,3)
    y=h-49*mm
    for title,body in [
      ('Bossen ankommer under Refill','Efter sidste almindelige monster er trukket, kommer Stage 1 i første ledige plads. Er rækken fuld, venter bossen. Almindelige monstre kan stadig stå i rækken.'),
      ('Stage-skift giver en hel tur til at reagere','Dræbes Stage 1 eller 2, er dens plads tom ved fjendens angreb og reserveret til næste stage under Refill. Den nye stage har trykt Threat og kan først angribes, angribe og eskalere fra næste tur.'),
      ('Sejr og død sker straks','Stage 3 dræbt = sejr før andre monstre angriber. HP på 0 eller mindre efter fjendens angreb = død før Endure/Leave. Boss-stages giver ingen loot og kan ikke Endures.'),
      ('Scrap, når testen aktiverer det','Ét helt kort pr. tur fjernes permanent under Resolve. Ingen af kortets tal må bruges. Kortet går ikke i discard. Prisen er det mistede kort denne tur.'),
      ('Rækken beholder sine pladser','Flyt ikke monstre sammen for at lukke huller. Placeringen afgør lighed i Threat. Alle overlevende eskalerer, men kun den stærkeste overlevende angriber.')]:
        y=para(c,14*mm,y,f'<b>{title}</b><br/>{body}',182*mm,10,14)-7*mm
    y=para(c,14*mm,y,'<b>Eksempel fra GDD</b><br/>Hånd: Club 3, Rusty Strike 2, Shiv 1/1, Block 3.<br/>Række fra venstre: Goblin 4, Slime 3, Guard 5, Skeleton 5.',182*mm,10,14)-6*mm
    y=para(c,14*mm,y,'<b>A:</b> 3+1 til Goblin og 2+1 til Slime giver to Perfects: Dagger 3/2 og Salve 3. Guard angriber for 2 skade efter Block. Endure: kun Skeleton stiger til 6. Leave: Guard og Skeleton stiger til 6.',182*mm,10,14)-6*mm
    y=para(c,14*mm,y,'<b>B:</b> 3+2 til Skeleton giver Bone Blade 5. Shiv bruges ikke. Guard angriber for 2 skade efter Block. Endure: Goblin stiger til 5 og Slime til 4. Leave: også Guard stiger til 6.',182*mm,10,14)
    assert y>20*mm
    c.showPage()
    heading(c,'Spillebord','Læg kort ved pladserne. Behold altid rækkefølgen fra venstre.',3,3)
    y=h-53*mm
    for i in range(4):
        x=14*mm+i*46*mm;c.setStrokeColor(LINE);c.roundRect(x,y-62*mm,42*mm,62*mm,4)
        text(c,x+5*mm,y-10*mm,f'PLADS {i+1}',10,'Bold')
        text(c,x+5*mm,y-50*mm,'Threat: ____',9)
    y-=81*mm
    for i,label in enumerate(['DRAW','DISCARD','SCRAP (VALGFRIT)']):
        x=14*mm+i*62*mm;c.setStrokeColor(LINE);c.roundRect(x,y-45*mm,58*mm,45*mm,4)
        text(c,x+5*mm,y-11*mm,label,9,'Bold')
    y-=65*mm
    text(c,14*mm,y,'HP: ______ / 20',18,'Bold');text(c,112*mm,y,'BLOCK: ______',15,'Bold')
    text(c,14*mm,y-18*mm,'TUR: ______',15,'Bold')
    para(c,14*mm,y-32*mm,'Loot-bank og boss-stages ligger separat. Dette er en oversigt over pladserne; kortene kan lægges på bordet lige over arket. Ved samme Threat angriber den overlevende fjende længst til venstre.',182*mm,10)
    c.showPage();c.save();return path

def test_sheets():
    path=OUT/'Dungeon Row - Testark.pdf';c=canvas.Canvas(str(path),pagesize=A4)
    c.setTitle('Dungeon Row - Testark');w,h=A4
    heading(c,'Run-ark','Print ét sæt pr. run. Ingen resultater er udfyldt på forhånd.',1,5)
    y=h-52*mm
    for s in ['Run-nr.: __________   Dato: __________   Spiller: ____________________',
              'Observatør: ____________________   Papir / browser: ______________',
              'GDD / prototypeversion: __________   Blanding / seed: ______________',
              'Start-HP: ______   Scrap: til / fra   Eskalering: hver tur / hver anden tur',
              'Starttid: __________   Sluttid: __________   Varighed: __________ min.']:
        text(c,14*mm,y,s,10);y-=12*mm
    y-=3*mm
    y=para(c,14*mm,y,'<b>Testens spørgsmål</b><br/>Ønsker spilleren bestemte monstre på grund af deres loot? Opstår der interessante valg? Kan kernen bære 15-25 ture?',182*mm)-10*mm
    y=para(c,14*mm,y,'<b>Før turen afgøres</b><br/>Notér spillerens egne ord. Registrér en Perfect som bevidst, hvis spilleren på forhånd siger, at den er målet. Uden observation noteres "ukendt"; antag ikke, at alle Perfects er bevidste eller tilfældige.',182*mm)-10*mm
    y=para(c,14*mm,y,'<b>Under runnet</b><br/>Brug turloggen på side 2-3. Skriv længere overvejelser på side 4 med turnummer. I browseren kan de automatiske tal eksporteres; menneskelige observationer skal stadig registreres.',182*mm)-10*mm
    y=para(c,14*mm,y,'<b>Efter runnet</b><br/>Udfyld side 5. Hvis regler eller tal ændres, skriv præcist hvad og giv versionen et nyt navn. Hold automatiske gennemløb adskilt fra menneskelige spiltests.',182*mm)
    c.showPage()
    for page,start,end in [(2,1,13),(3,14,25)]:
        c.setPageSize(landscape(A4));pw,ph=landscape(A4)
        heading(c,f'Turlog {start}-{end}','HP/deck noteres ved turstart. Flere detaljer føres på observationsarket.',page,5,landscape(A4))
        x=14*mm;y=ph-49*mm
        widths=[10,14,13,11,21,26,19,17,18,45,75]
        assert sum(widths)==269
        headers=['Tur','HP','Deck','Kills','Perfect\nB / T / ?','Valg\nE / L / boss','Scrap\nkort','Flyttede\ntildelinger','To linjer\nja / nej','Ønsket loot / citat','Angriber, Leave-mål og bemærkninger']
        hh=14*mm;rh=9*mm
        cx=x
        for width,label in zip(widths,headers):
            c.setFillColor(PALE);c.setStrokeColor(LINE);c.rect(cx,y-hh,width*mm,hh,fill=1,stroke=1)
            for n,line in enumerate(label.split('\n')):text(c,cx+2*mm,y-5*mm-n*4*mm,line,7.5,'Bold')
            cx+=width*mm
        y-=hh
        for turn in range(start,end+1):
            cx=x
            for col,width in enumerate(widths):
                c.setStrokeColor(LINE);c.rect(cx,y-rh,width*mm,rh,fill=0,stroke=1)
                if col==0:text(c,cx+3*mm,y-6*mm,turn,9,'Bold')
                cx+=width*mm
            y-=rh
        text(c,x,20*mm,'B = bevidst, T = tilfældig, ? = ukendt. E = Endure, L = Leave. Bossens automatiske fastholdelse tæller ikke som Leave.',8,color=GREY)
        c.showPage()
    c.setPageSize(A4)
    heading(c,'Observationer','Spillerens overvejelser og ændrede valg',4,5)
    y=h-52*mm
    for n in range(3):
        text(c,14*mm,y,'Tur: ______   Ønsket monster / loot: ______________________________',10,'Bold')
        y-=9*mm;text(c,14*mm,y,'To overvejede linjer og hvorfor spilleren valgte den ene:',9)
        y=lines(c,14*mm,y-7*mm,182*mm,2,8*mm)-2*mm
        text(c,14*mm,y,'Ændrede loot-ønsket valget? Plan med Leave / planlagt Perfect:',9)
        y=lines(c,14*mm,y-7*mm,182*mm,2,8*mm)-8*mm
    c.showPage()
    heading(c,'Efter runnet','Udfald og et kort interview',5,5)
    y=h-51*mm
    for s in ['Udfald: sejr / død / afbrudt     Floor nået: ______     Ture: ______',
              'Varighed: ______ min.     Første kedelige tur: ______ / ingen / ukendt']:
        text(c,14*mm,y,s,10);y-=11*mm
    prompts=[
      'Hvilke monstre håbede spilleren at møde, og hvorfor?',
      'Hvilket valg var mest interessant? Hvornår manglede et reelt valg?',
      'Førte Leave til det ønskede kill? Hvilket monster og hvilken tur?',
      'Hvornår blev deck bloat et problem? Blev junk beholdt for at blokere en plads?',
      'Slut-deck (eller navn på browserens eksporterede JSON):',
      'Regeluklarheder, ændringer og næste hypotese at teste:']
    for prompt in prompts:
        y=para(c,14*mm,y,prompt,182*mm,10,13)
        y=lines(c,14*mm,y-7*mm,182*mm,2,8*mm)-5*mm
    assert y>16*mm,y
    c.showPage();c.save();return path

paths=[print_cards(),guide(),test_sheets()]
for path in paths:
    reader=PdfReader(path)
    assert all(page.extract_text().strip() for page in reader.pages)
    print(f'{path.name}: {len(reader.pages)} sider, {path.stat().st_size} bytes')
