--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.orderstatus AS ENUM (
    'pending',
    'paid',
    'processing',
    'done',
    'canceled'
);


ALTER TYPE public.orderstatus OWNER TO "user";

--
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.paymentmethod AS ENUM (
    'auto',
    'manual',
    'sberbank',
    'sbp',
    'ton',
    'usdt',
    'unitpay'
);


ALTER TYPE public.paymentmethod OWNER TO "user";

--
-- Name: producttype; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.producttype AS ENUM (
    'currency',
    'item',
    'service'
);


ALTER TYPE public.producttype OWNER TO "user";

--
-- Name: supportstatus; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.supportstatus AS ENUM (
    'new',
    'in_progress',
    'resolved'
);


ALTER TYPE public.supportstatus OWNER TO "user";

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: user
--

CREATE TYPE public.userrole AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.userrole OWNER TO "user";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO "user";

--
-- Name: article_tags; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.article_tags (
    article_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.article_tags OWNER TO "user";

--
-- Name: article_tags_table; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.article_tags_table (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    color character varying(7),
    created_at timestamp without time zone,
    is_category boolean
);


ALTER TABLE public.article_tags_table OWNER TO "user";

--
-- Name: article_tags_table_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.article_tags_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.article_tags_table_id_seq OWNER TO "user";

--
-- Name: article_tags_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.article_tags_table_id_seq OWNED BY public.article_tags_table.id;


--
-- Name: articles; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.articles (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt character varying(500),
    featured_image_url character varying(500),
    featured_image_alt character varying(255),
    published boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    published_at timestamp without time zone,
    category character varying(100),
    game_id integer,
    author_name character varying(100)
);


ALTER TABLE public.articles OWNER TO "user";

--
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.articles_id_seq OWNER TO "user";

--
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.auth_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL
);


ALTER TABLE public.auth_tokens OWNER TO "user";

--
-- Name: auth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.auth_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auth_tokens_id_seq OWNER TO "user";

--
-- Name: auth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.auth_tokens_id_seq OWNED BY public.auth_tokens.id;


--
-- Name: game_faqs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.game_faqs (
    id integer NOT NULL,
    game_id integer NOT NULL,
    question character varying(500) NOT NULL,
    answer text NOT NULL,
    sort_order integer,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.game_faqs OWNER TO "user";

--
-- Name: game_faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.game_faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_faqs_id_seq OWNER TO "user";

--
-- Name: game_faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.game_faqs_id_seq OWNED BY public.game_faqs.id;


--
-- Name: game_input_fields; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.game_input_fields (
    id integer NOT NULL,
    game_id integer NOT NULL,
    subcategory_id integer,
    name character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    field_type character varying(20) NOT NULL,
    required boolean NOT NULL,
    placeholder character varying(255),
    help_text text,
    options json,
    min_length integer,
    max_length integer,
    validation_regex character varying(500),
    sort_order integer NOT NULL,
    enabled boolean NOT NULL
);


ALTER TABLE public.game_input_fields OWNER TO "user";

--
-- Name: game_input_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.game_input_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_input_fields_id_seq OWNER TO "user";

--
-- Name: game_input_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.game_input_fields_id_seq OWNED BY public.game_input_fields.id;


--
-- Name: game_instructions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.game_instructions (
    id integer NOT NULL,
    game_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    sort_order integer,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.game_instructions OWNER TO "user";

--
-- Name: game_instructions_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.game_instructions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_instructions_id_seq OWNER TO "user";

--
-- Name: game_instructions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.game_instructions_id_seq OWNED BY public.game_instructions.id;


--
-- Name: game_subcategories; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.game_subcategories (
    id integer NOT NULL,
    game_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sort_order integer NOT NULL,
    enabled boolean NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.game_subcategories OWNER TO "user";

--
-- Name: game_subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.game_subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.game_subcategories_id_seq OWNER TO "user";

--
-- Name: game_subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.game_subcategories_id_seq OWNED BY public.game_subcategories.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.games (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    banner_url character varying(255),
    auto_support boolean NOT NULL,
    instructions text,
    sort_order integer NOT NULL,
    description text,
    subcategory_description text,
    logo_url character varying(255),
    faq_content text,
    enabled boolean,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.games OWNER TO "user";

--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.games_id_seq OWNER TO "user";

--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    game_id integer NOT NULL,
    product_id integer NOT NULL,
    manual_game_name character varying(255),
    amount numeric(10,2) NOT NULL,
    currency character varying(10) NOT NULL,
    status public.orderstatus NOT NULL,
    payment_method public.paymentmethod NOT NULL,
    transaction_id character varying(255),
    auto_processed boolean,
    comment text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    payment_url character varying(2000)
);


ALTER TABLE public.orders OWNER TO "user";

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO "user";

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payment_terms; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.payment_terms (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    is_required boolean,
    is_active boolean,
    sort_order integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.payment_terms OWNER TO "user";

--
-- Name: payment_terms_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.payment_terms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_terms_id_seq OWNER TO "user";

--
-- Name: payment_terms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.payment_terms_id_seq OWNED BY public.payment_terms.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.products (
    id integer NOT NULL,
    game_id integer NOT NULL,
    name character varying(100) NOT NULL,
    price_rub numeric(10,2) NOT NULL,
    old_price_rub numeric(10,2),
    min_amount numeric(10,2),
    max_amount numeric(10,2),
    type public.producttype NOT NULL,
    description text,
    instructions text,
    enabled boolean,
    delivery character varying(20),
    sort_order integer NOT NULL,
    input_fields json,
    special_note character varying(255),
    note_type character varying(20),
    subcategory character varying(100),
    image_url character varying(255),
    subcategory_id integer,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.products OWNER TO "user";

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO "user";

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: referral_earnings; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.referral_earnings (
    id integer NOT NULL,
    referrer_id integer NOT NULL,
    referred_user_id integer NOT NULL,
    order_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    percentage numeric(5,2) NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.referral_earnings OWNER TO "user";

--
-- Name: referral_earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.referral_earnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.referral_earnings_id_seq OWNER TO "user";

--
-- Name: referral_earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.referral_earnings_id_seq OWNED BY public.referral_earnings.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    order_id integer NOT NULL,
    rating integer NOT NULL,
    text text NOT NULL,
    email character varying(255) NOT NULL,
    game_name character varying(255) NOT NULL,
    is_approved boolean NOT NULL,
    is_anonymous boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.reviews OWNER TO "user";

--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reviews_id_seq OWNER TO "user";

--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.support_messages (
    id integer NOT NULL,
    user_id bigint,
    message text NOT NULL,
    is_from_user boolean NOT NULL,
    created_at timestamp without time zone,
    status public.supportstatus NOT NULL,
    admin_id bigint,
    thread_id integer,
    guest_id character varying
);


ALTER TABLE public.support_messages OWNER TO "user";

--
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.support_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.support_messages_id_seq OWNER TO "user";

--
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.support_messages_id_seq OWNED BY public.support_messages.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    telegram_id integer,
    username character varying(100),
    email character varying(255),
    balance numeric(12,2) NOT NULL,
    role public.userrole NOT NULL,
    referral_code character varying(20),
    referred_by_id integer,
    referral_earnings numeric(12,2) NOT NULL,
    total_referrals integer NOT NULL,
    created_at timestamp without time zone,
    password_hash character varying(255)
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: article_tags_table id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags_table ALTER COLUMN id SET DEFAULT nextval('public.article_tags_table_id_seq'::regclass);


--
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- Name: auth_tokens id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_tokens ALTER COLUMN id SET DEFAULT nextval('public.auth_tokens_id_seq'::regclass);


--
-- Name: game_faqs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_faqs ALTER COLUMN id SET DEFAULT nextval('public.game_faqs_id_seq'::regclass);


--
-- Name: game_input_fields id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_input_fields ALTER COLUMN id SET DEFAULT nextval('public.game_input_fields_id_seq'::regclass);


--
-- Name: game_instructions id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_instructions ALTER COLUMN id SET DEFAULT nextval('public.game_instructions_id_seq'::regclass);


--
-- Name: game_subcategories id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_subcategories ALTER COLUMN id SET DEFAULT nextval('public.game_subcategories_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payment_terms id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.payment_terms ALTER COLUMN id SET DEFAULT nextval('public.payment_terms_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: referral_earnings id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.referral_earnings ALTER COLUMN id SET DEFAULT nextval('public.referral_earnings_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.support_messages ALTER COLUMN id SET DEFAULT nextval('public.support_messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.alembic_version (version_num) FROM stdin;
94eb1da41752
\.


--
-- Data for Name: article_tags; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.article_tags (article_id, tag_id) FROM stdin;
1	2
1	3
1	4
\.


--
-- Data for Name: article_tags_table; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.article_tags_table (id, name, slug, color, created_at, is_category) FROM stdin;
1	Новости	новости	#3B82F6	2025-07-17 08:28:54.845419	t
2	Гайды	гайды	#3B82F6	2025-07-17 08:29:24.27664	t
3	Vikings War of Clans	vikings-war-of-clans	#3B82F6	2025-07-17 08:29:24.282564	f
4	Гайд	гайд	#3B82F6	2025-07-17 08:29:24.285689	f
\.


--
-- Data for Name: articles; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.articles (id, title, slug, content, excerpt, featured_image_url, featured_image_alt, published, created_at, updated_at, published_at, category, game_id, author_name) FROM stdin;
1	📘 ГАЙД ПО ПРОКАЧКЕ ЗДАНИЙ 41–50 УРОВЕНЬ	-гайд-по-прокачке-зданий-4150-уровень-	<h1><strong>Гайд по прокачки зданий от DonateRaid</strong></h1><p></p><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://t.me/donat4yous"><strong>https://t.me/donat4yous</strong></a><strong> - 🔥Все матрёшки, вся актуальная информация по викингам только здесь🔥</strong></p><p></p><img src="https://i.imgur.com/L80UftF.jpeg"><p></p><h3><strong>📌 Описание графика:</strong></h3><p>На графике показана <strong>эффективность зданий по соотношению золота к времени улучшения</strong> (чем <strong>ниже значение</strong> — тем <strong>выгоднее</strong> улучшение).</p><ul><li><p><strong>Лидеры по эффективности</strong>:</p></li><li><p>🔹 <em>Дозорный</em>, <em>Кузня</em>, <em>Святилище Асов</em> — дают мощные бонусы при умеренных тратах.</p></li><li><p>🔹 <em>Оракул</em> и <em>Храм Одина</em> также в топе, особенно важны для науки и боевого потенциала.</p></li><li><p><strong>Менее выгодные</strong> по затратам:</p></li><li><p>🔸 <em>Зал Таланта</em>, <em>Рудник</em>, <em>Убежище</em> — требуют больше золота на единицу времени.</p></li></ul><p><strong>Общие таблицы и их пояснения:</strong></p><img src="https://i.imgur.com/g4mfklZ.jpeg"><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://docs.google.com/spreadsheets/d/1s63fdJ8TOQRdCeTs6IgLvfv70A__dFFVVwA3Hcsz-7c/edit?usp=sharing">https://docs.google.com/spreadsheets/d/1s63fdJ8TOQRdCeTs6IgLvfv70A__dFFVVwA3Hcsz-7c/edit?usp=sharing</a></p><p></p><img src="https://i.imgur.com/luRPgKs.jpeg"><p></p><img src="https://i.imgur.com/gMOJvO1.jpeg"><p></p><h3><strong>Что мы имеем?</strong></h3><blockquote><p><strong><em>ТОП 5 по эффективности (лучшее соотношение Золото/Время):</em></strong></p></blockquote><img src="https://i.imgur.com/9MSCb4L.png"><p><strong>Вывод:</strong> Эти здания дают <strong>сильные бонусы</strong> при <strong>низких затратах</strong>, особенно <strong>Кузня</strong> и <strong>Мастерская</strong> — лучшее вложение в защиту и армию.</p><h3><strong>🔥 ТОП 5 по мощности бонуса:</strong></h3><img src="https://i.imgur.com/RmfZ3j7.png"><p>📌 <strong>Вывод:</strong> Эти здания дают <strong>уникальные бонусы</strong>, которые напрямую влияют на масштаб PvP, экономику и науку. Они <strong>обязательно к прокачке</strong>, даже несмотря на высокую цену.</p><h3><strong>Самые дорогие по золоту (топ затрат):</strong></h3><img src="https://i.imgur.com/ShGunSj.png"><p>⚠️ Эти здания <strong>дорогие</strong>, но их бонусы критически важны на поздних этапах игры.</p><h3><strong>🧠 Общий анализ:</strong></h3><img src="https://i.imgur.com/QVELi79.png"><p></p><h3><strong>✅ Рекомендации:</strong></h3><ol><li><p><strong>Качай сначала Кузню, Дозорный, Мастерскую</strong> — они дешёвые и дают сильные боевые бонусы.</p></li><li><p><strong>Оракул и Храм Одина</strong> — прокачиваются при приоритете на науку/PvP.</p></li><li><p><strong>Рынок и Ферма</strong> — мастхэв для активной экономики и логистики.</p></li><li><p><strong>Военный блок, Стена</strong> — в долгую, особенно если идёшь в топ.</p></li><li><p><strong>Прокачка по направлению</strong>: смотри на свои цели — оборона, атака, сбор, охота на Асах и т.д.</p></li></ol><h3><strong>🧠 Глобальные рекомендации по прокачке зданий (41–50 уровень)</strong></h3><h3><strong>🔥 1. Прокачка по цели игрока</strong></h3><h4><strong>⚔️ Если ты атакующий игрок (PvP):</strong></h4><ul><li><p><strong>В приоритете</strong>:</p></li><li><p><strong>Военный блок</strong> — даёт +16% к числу войск в штурме (ключевой бонус!)</p></li><li><p><strong>Храм Одина</strong> — +55K к походу = огромная армия</p></li><li><p><strong>Чертог воинов</strong> — +50% к защите при атаке</p></li><li><p><strong>Казармы / Поместье</strong> — ускоряют набор</p></li><li><p><strong>Мастерская рун</strong> — +50% урона по нежити (актуально при PvE)</p></li><li><p><strong>Почему</strong>: эти здания прямо усиливают наступательный потенциал — армия больше, урон выше, обучение быстрее.</p></li></ul><h4><strong>🛡 Если ты защитник (деф-профиль):</strong></h4><ul><li><p><strong>В приоритете</strong>:</p></li><li><p><strong>Кузня</strong> — даёт +50% к защите всех войск (и при атаке, и при обороне)</p></li><li><p><strong>Дозорный</strong> — +6% к защите всех войск, <strong>и при этом самое выгодное по эффективности</strong></p></li><li><p><strong>Стена</strong> — +50% к защите города</p></li><li><p><strong>Рудник</strong> — +27.5% к здоровью</p></li><li><p><strong>Лазарет</strong> — +10% к вместимости лазарета</p></li><li><p><strong>Почему</strong>: эти здания формируют крепкий город, стойкие войска и уменьшают потери.</p></li></ul><h3><strong>🧠 Если ты фокусируешься на прокачке и исследованиях:</strong></h3><p><strong>В приоритете</strong>:</p><ul><li><p><strong>Оракул</strong> — +120% к скорости изучения (без него наука будет тормозить)</p></li><li><p><strong>Зал Таланта</strong> — +50% здоровья всех войск</p></li><li><p><strong>Святилище Асов</strong> — пассивные бонусы, усиливающие аккаунт глобально</p></li></ul><p><strong>Почему</strong>: на высоких уровнях исследования стоят сотни триллионов — без этих зданий ты потратишь в 2–3 раза больше времени и ресурсов.</p><h3><strong>💰 Если играешь через экономику / поддержку:</strong></h3><p><strong>В приоритете</strong>:</p><ul><li><p><strong>Рынок</strong> — +125M к ресурсоотправке и 100% к скорости каравана</p></li><li><p><strong>Ферма / Лесопилка / Каменоломня</strong> — для добычи, особенно если нет активного доната</p></li><li><p><strong>Убежище</strong> — защищает твои ресурсы от грабежей</p></li><li><p><strong>Брачный зал</strong> — +175M к подкреплению союзникам</p></li><li><p><strong>Оплот Валькирий</strong> — усиливает пассивные характеристики</p></li></ul><h3><strong>📊 2. Что выгоднее всего качать по эффективности</strong></h3><img src="https://i.imgur.com/LYyqpPw.png"><p></p><p><strong>Вывод:</strong></p><p>Кузня + Дозорный = <strong>лучший деф-пак по цене/качеству</strong></p><p>Казармы = дешёвое, но мощное здание для всех</p><p>Оракул / Храм Одина = <strong>нельзя игнорировать</strong>, даже если дорого</p><h3><strong>🎯 3. Если хочешь идти по минимальному пути прокачки</strong></h3><p>⚡ Для баланса между эффективностью и бонусами:</p><h3><strong>Приоритет 1:</strong></h3><ul><li><p><strong>Кузня</strong></p></li><li><p><strong>Дозорный</strong></p></li><li><p><strong>Казармы</strong></p></li><li><p><strong>Мастерская</strong></p></li><li><p><strong>Рынок</strong></p></li></ul><h3><strong>Приоритет 2:</strong></h3><ul><li><p><strong>Оракул</strong></p></li><li><p><strong>Храм Одина</strong></p></li><li><p><strong>Святилище Асов</strong></p></li><li><p><strong>Военный блок</strong></p></li><li><p><strong>Брачный зал / Убежище</strong></p></li></ul><h3><strong>✅ Заключение</strong></h3><ul><li><p>Прокачка <strong>не должна быть слепой</strong> — смотри на эффективность и цели.</p></li><li><p>Не пренебрегай <strong>бонусами к защите и здоровью</strong>, даже если они не видны сразу — они решают исход боя.</p></li><li><p>Используй файл и графики как <strong>дорожную карту</strong> и <strong>план развития</strong>.</p></li></ul><p></p><p>И не забывай подписываться на нас, мы даем ТОЛКОВЫЕ советы: <a target="_blank" rel="noopener noreferrer nofollow" href="https://t.me/donat4yous">https://t.me/donat4yous</a></p><p></p>	\N	/uploads/blog/6a409f0f39d2425288eac659500b68ce.png	\N	t	2025-07-17 08:28:54.836614	2025-07-17 08:29:24.288692	2025-07-17 08:28:54.835412	Гайды	\N	DonateRaid
\.


--
-- Data for Name: auth_tokens; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.auth_tokens (id, user_id, token, expires_at) FROM stdin;
1	1	d0236534-e423-4335-8756-429dda85e235	2025-07-16 15:06:17.348526
2	1	28abfa56-8443-4412-be75-d5db2ebcbf85	2025-07-16 15:08:56.035217
6	4	7d595a44-a687-44bd-bc7c-b98b072d269f	2025-07-18 18:01:28.299845
7	5	01f7ad7f-e90e-414d-a9a7-a819b6b7f90c	2025-07-19 06:26:10.001633
\.


--
-- Data for Name: game_faqs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.game_faqs (id, game_id, question, answer, sort_order, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: game_input_fields; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.game_input_fields (id, game_id, subcategory_id, name, label, field_type, required, placeholder, help_text, options, min_length, max_length, validation_regex, sort_order, enabled) FROM stdin;
4	1	\N	Email	Plarium ID Email	text	t	Введите почту от Plarium ID	\N	null	\N	\N	\N	0	t
5	1	\N	Пароль	Пароль Plarium ID	text	t	Введите пароль от Plarium ID	\N	null	\N	\N	\N	1	t
6	3	\N	Email	Email	text	t	Введите почту от Supercell	Ваша эл.почта от аккаунта	null	\N	\N	\N	0	t
7	4	\N	Email	Plarium ID Email 	email	t	Введите почту от Plarium ID		null	\N	\N	\N	0	t
8	4	\N	Пароль	Пароль Plarium ID	password	t	Введите пароль от Plarium ID		null	\N	\N	\N	1	t
16	7	\N	Nuts Login	Nuts Login	text	t	Введите Nuts ID	\N	null	\N	\N	\N	0	t
17	7	\N	Nuts пароль	Nuts Password	text	t	Введите пароль от Nuts	\N	null	\N	\N	\N	1	t
18	7	\N	Сервер	Введите Сервер	text	t	Введите сервер для доната	На какой сервер нужно задонатить	null	\N	\N	\N	2	t
25	2	\N	UID	UID	text	t	Введите ваш UID	Укажите свой UID PUBG Mobile (его можно посмотреть в профиле игры)	null	\N	\N	\N	0	t
26	6	\N	Supercell Email	Supercell Email	text	t	Введите почту от Supercell	\N	null	\N	\N	\N	0	t
27	8	\N	UID	UID	text	t	Введите ваш UID	Найти можно в профиле игры	null	\N	\N	\N	0	t
28	8	\N	Zona ID	Zona ID	text	t	Введите ваш Zona ID или Player ID	Найти можно в профиле игры	null	\N	\N	\N	1	t
34	9	\N	UID	UID	text	t	Введите ваш UID	UID найти можно в профиле игры	null	\N	\N	\N	0	t
35	9	\N	Server ID	Server	text	t	Введите Server	Europe, America, Asia или TW,HK,MO	null	\N	\N	\N	1	t
36	5	\N	Supercell Email	Supercell Email	text	t	Введите Supercell email	Ваша электронная почта от аккаунта	null	\N	\N	\N	0	t
\.


--
-- Data for Name: game_instructions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.game_instructions (id, game_id, title, content, sort_order, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: game_subcategories; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.game_subcategories (id, game_id, name, description, sort_order, enabled, created_at) FROM stdin;
1	3	Гемы	\N	0	t	2025-07-21 06:40:40.688378
2	3	Боевой пропуск	\N	1	t	2025-07-21 06:40:40.959221
3	8	Россия	Товары для РУ региона	0	t	2025-07-21 12:02:09.750671
4	10	1	\N	0	t	2025-07-24 11:07:47.346418
5	5	Гемы	\N	0	t	2025-07-24 12:00:26.86768
6	5	Боевой пропуск	\N	1	t	2025-07-24 12:00:26.938585
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.games (id, name, banner_url, auto_support, instructions, sort_order, description, subcategory_description, logo_url, faq_content, enabled, is_deleted) FROM stdin;
1	Vikings War of Clans	\N	t	1️⃣ Введите почту и пароль от аккаунта\n2️⃣ Оплатите удобным для вас способом\n3️⃣ Отправьте в чат скрины, какие именно наборы нужно купить\n4️⃣ Мы зайдём на ваш аккаунт и приобретём донат в течение нескольких минут!	0	Vikings: War of Clans — онлайн-стратегия о мире викингов, где побеждает сильнейший. Развивай город, строй армию, вступай в кланы и сражайся за власть!\n💰 Ускорь прогресс с донатом: золото, ускорители, ресурсы и VIP-бонусы помогут тебе стать топ-игроком быстрее!\n\n📌 Почему стоит выбрать нас?\n\nБыстрое пополнение без лишних ожиданий\nБезопасно: не передаём данные третьим лицам\nВыгодные цены на игровые наборы и пакеты ресурсов\n\n⚠️ Важно знать\nМы не являемся официальным представителем Plarium\nОтветственность за передачу данных и поведение в игре лежит на пользователе	Любой регион	/uploads/admin/4eb8503df6d845e78d06f47dcc0f413f.png	[\n  {\n    "question": "Что такое золото в Vikings: War of Clans?",\n    "answer": "Золото — основная премиум-валюта в игре Vikings: War of Clans. С его помощью можно ускорять строительство, покупать ресурсы, улучшения и специальные наборы."\n  },\n  {\n    "question": "Как пополнить баланс в Vikings: War of Clans?",\n    "answer": "Для пополнения баланса укажите почту и пароль от аккаунта, оплатите удобным способом и отправьте нам скриншоты нужных наборов. Мы зайдём на аккаунт и купим донат в течение нескольких минут."\n  },\n  {\n    "question": "Насколько это безопасно?",\n    "answer": "Все действия выполняются вручную, ваши данные не передаются третьим лицам. Мы не сохраняем аккаунты, и безопасность для нас — приоритет."\n  },\n  {\n    "question": "Сколько времени занимает пополнение?",\n    "answer": "Как правило, от 5 до 15 минут. В редких случаях время ожидания может увеличиться до 1 часа."\n  },\n  {\n    "question": "Можно ли пополнить аккаунт из России?",\n    "answer": "Да, мы работаем с аккаунтами из любой страны, включая Россию и страны СНГ."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Мы поддерживаем множество способов оплаты, включая карты, электронные кошельки. Конкретные методы зависят от вашей страны."\n  },\n  {\n    "question": "Что делать, если набор в магазине не отображается?",\n    "answer": "Иногда наборы появляются только во время акций. Убедитесь, что они есть в магазине перед покупкой, и пришлите нам скрин."\n  }\n]	t	f
3	Brawl Stars	\N	t	1️⃣ Выберите нужный товар\nНа странице выберите количество гемов или боевой пропуск, который вы хотите приобрести.\n\n2️⃣ Введите логин от аккаунта Supercell\nУкажите почту, привязанную к вашему аккаунту Supercell. Это необходимо, чтобы мы могли выполнить вход и оформить покупку.\n⚠️ Убедитесь, что вы указали корректный email — код для входа придёт именно на него.\n\n3️⃣ Оплатите заказ\nНажмите кнопку «Купить» и выберите удобный способ оплаты. Все транзакции проходят через защищённые каналы с использованием ваших платёжных данных.\n\n4️⃣ Предоставьте код для входа\nПосле оплаты на указанную почту придёт 6-значный код подтверждения от Supercell.\nВведите этот код в чате заказа, чтобы мы смогли зайти в аккаунт и завершить покупку.\n\n5️⃣ Ожидайте выполнения заказа\n⛔ Не заходите в игру, пока заказ не будет завершён.\nПосле изменения статуса на «Выполнен», гемы будут успешно зачислены на ваш аккаунт.	2	Brawl Stars — популярный мобильный шутер от Supercell, где игроки сражаются в быстрых боях 3 на 3. Чтобы открывать новых бойцов, улучшать персонажей, покупать скины и боевые пропуски, используется валюта Gems (гемы).\nС помощью пополнения через нас вы получаете гемы быстро, безопасно и официально — напрямую через магазин Supercell.	Выберите категорию	/uploads/admin/3020835182a04c1cac01e44bc140abd2.webp	[\n  {\n    "question": "Что такое гемы в Brawl Stars и для чего они нужны?",\n    "answer": "Гемы — премиальная валюта Brawl Stars. С их помощью вы можете покупать скины, бойцов, боевой пропуск Brawl Pass, акции и ускорять прогресс в игре."\n  },\n  {\n    "question": "Как пополнить гемы через вас?",\n    "answer": "Просто выберите нужный пакет, укажите ваш UID и никнейм из профиля Brawl Stars, оплатите заказ. Мы через официальный магазин Supercell зачислим гемы на ваш аккаунт."\n  },\n  {\n    "question": "Насколько безопасно покупать гемы через вас?",\n    "answer": "100% безопасно. Мы не просим логин и пароль. Покупка происходит через официальную систему Supercell. Вы просто получаете гемы на аккаунт."\n  },\n  {\n    "question": "Сколько времени занимает пополнение гемов?",\n    "answer": "Обычно гемы поступают в течение 1–5 минут после оплаты. В редких случаях из-за технических работ на серверах Supercell доставка может занять до 15 минут."\n  },\n  {\n    "question": "Что делать, если гемы не пришли?",\n    "answer": "Проверьте правильность введённого UID. Если всё верно, напишите нам в чат на сайте или в Telegram — мы быстро решим проблему."\n  },\n  {\n    "question": "Как узнать свой UID в Brawl Stars?",\n    "answer": "Зайдите в Brawl Stars, откройте профиль игрока. UID (Player Tag) начинается с символа # и указан под вашим никнеймом."\n  },\n  {\n    "question": "Можно ли пополнить аккаунт из России?",\n    "answer": "Да, мы работаем с игроками из всех стран, включая Россию и страны СНГ. Регион аккаунта значения не имеет."\n  },\n  {\n    "question": "Какие способы оплаты вы принимаете?",\n    "answer": "Мы принимаем банковские карты (Visa, MasterCard, Мир), электронные кошельки (ЮMoney, QIWI, Payeer и другие), а также другие популярные способы оплаты."\n  },\n  {\n    "question": "Вы используете официальный магазин?",\n    "answer": "Да, все гемы покупаются только через официальный магазин Supercell. Это безопасно для вашего аккаунта."\n  }\n]	t	f
4	Mech Arena	\N	t	🔑 Инструкция по пополнению:\n1️⃣ Выберите нужный товар (A-Coins, кредиты, боевой пропуск и др.)\n2️⃣ Введите логин и пароль от аккаунта Plarium (Mech Arena)\n3️⃣ Оплатите удобным для вас способом\n4️⃣ Мы зайдём на ваш аккаунт и приобретём выбранный донат в течение нескольких минут после оплаты\n5️⃣ Если возникнут вопросы — напишите нам в чате на сайте или в Telegram-поддержке. Мы всегда на связи.	1	Mech Arena — это быстрые PvP-сражения 5 на 5, где вы управляете боевыми мехами с уникальным оружием и способностями. Чтобы максимально раскрыть потенциал ваших мехов, покупайте премиум-валюту A-Coins и кредиты. Донат ускоряет прогресс: вы быстрее открываете новых роботов, улучшаете их вооружение и получаете доступ к эксклюзивным скинам и боевым пропускам.	\N	/uploads/admin/f09f32cd5eed4d68908352af2164d4b5.jpg	[\n  {\n    "question": "Что даёт донат в Mech Arena?",\n    "answer": "Донат позволяет быстрее открывать новых мехов, улучшать оружие, покупать премиум-снаряжение и скины. Также доступен боевой пропуск и эксклюзивные предложения магазина."\n  },\n  {\n    "question": "Как пополнить баланс Mech Arena через вас?",\n    "answer": "Просто выберите нужный пакет, укажите данные от аккаунта Plarium, оплатите заказ, и мы зайдём на ваш аккаунт для покупки выбранных паков."\n  },\n  {\n    "question": "Безопасно ли передавать данные от аккаунта?",\n    "answer": "Да, все покупки осуществляются вручную. Мы не сохраняем ваши данные и не передаём их третьим лицам. После выполнения заказа доступ удаляется."\n  },	t	f
9	Genshin Impact	\N	t	1️⃣ Выберите нужный товар\nВыберите количество кристаллов или боевой пропуск, который хотите приобрести.\n\n2️⃣ Введите ваш UID и регион сервера. UID отображается в левом нижнем углу экрана в игре и выглядит как 9-значный номер. Укажите также ваш регион сервера (Europe, America, Asia или TW,HK,MO).\n\n3️⃣ Оплатите заказ\nНажмите «Купить» и выберите удобный способ оплаты. Все транзакции защищены.\n\n4️⃣ Ожидайте выполнения заказа\nПосле оплаты кристаллы будут зачислены на ваш аккаунт через официальный магазин miHoYo. Время зачисления — от 1 до 15 минут.\n\n5️⃣ Если возникнут вопросы — свяжитесь с нами через чат на сайте или Telegram-поддержку.	7	Genshin Impact — популярная приключенческая RPG от miHoYo, в которой вы исследуете огромный открытый мир, сражаетесь с монстрами, выполняете квесты и собираете коллекцию персонажей. Донат позволяет получать кристаллы истока (Genesis Crystals), которые используются для покупки молитв (желаний), боевых пропусков и других внутриигровых бонусов.	\N	/uploads/admin/ebae0e0bc7084f2dbeddbf7d657f422d.webp	[\n  {\n    "question": "Что дают алмазы в Mobile Legends?",\n    "answer": "Алмазы — это премиум-валюта. С их помощью можно покупать скины, героев, эмблемы, пропуски и участвовать в событиях."\n  },\n  {\n    "question": "Как пополнить алмазы через ваш сервис?",\n    "answer": "Выберите нужный пакет, укажите ваш UID и Server, оплатите заказ — и мы моментально отправим алмазы через официальный магазин."\n  },\n  {\n    "question": "Где найти мой UID и Server?",\n    "answer": "Зайдите в игру, нажмите на аватар в левом верхнем углу. Под ником будут указаны UID и Server."\n  },\n  {\n    "question": "Сколько времени занимает зачисление алмазов?",\n    "answer": "В среднем 1–5 минут после оплаты. В редких случаях — до 15 минут."\n  },\n  {\n    "question": "Вы используете официальный магазин MLBB?",\n    "answer": "Да, все покупки происходят только через официальные каналы Moonton."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Мы принимаем карты (Visa, MasterCard, Мир), а также электронные кошельки"\n  },\n  {\n    "question": "Нужно ли входить в игру во время пополнения?",\n    "answer": "Нет. Просто не заходите в игру во время выполнения заказа, чтобы избежать задержек."\n  },\n  {\n    "question": "Вы работаете с аккаунтами из России и СНГ?",\n    "answer": "Да, мы обслуживаем все регионы, включая Россию, Беларусь, Казахстан и другие."\n  },\n  {\n    "question": "Насколько безопасна покупка?",\n    "answer": "Мы не просим логин/пароль от аккаунта. Все операции выполняются через официальный магазин Moonton и не несут риска для аккаунта."\n  }\n]	t	f
5	Clash of Clans	\N	t	🔧 Инструкция по пополнению через Supercell ID:\n1️⃣ Выберите нужный товар\nНа странице выберите количество кристаллов или пропуск, который вы хотите приобрести.\n\n2️⃣ Введите почту от Supercell ID\nУкажите email, к которому привязан ваш аккаунт Clash of Clans. Убедитесь в правильности адреса — код для входа будет отправлен именно туда.\n\n3️⃣ Оплатите заказ\nНажмите «Купить» и выберите удобный способ оплаты (карты, электронные кошельки и др.). Все платежи проходят через защищённые каналы.\n\n4️⃣ Предоставьте код из письма Supercell\nПосле оплаты на вашу почту поступит 6-значный код входа от Supercell. Отправьте его в чат заказа — мы используем его, чтобы зайти на ваш аккаунт и выполнить покупку.\n\n5️⃣ Ожидайте завершения заказа\nПожалуйста, не заходите в игру, пока заказ не будет выполнен. После изменения статуса на «Выполнен» все кристаллы/товары будут зачислены на ваш аккаунт.	3	Clash of Clans — культовая мобильная стратегия от Supercell, где вы строите деревню, прокачиваете армию и сражаетесь с игроками со всего мира. Чтобы ускорить развитие и получить доступ к эксклюзивным скинам и пропускам, используется внутриигровая валюта — кристаллы (gems).\nЧерез нас вы можете безопасно и официально пополнить аккаунт, чтобы купить кристаллы, Gold Pass, ресурсы и другие внутриигровые предметы.	\N	/uploads/admin/2b1f6f77c48143da990c44b1c54c4c72.webp	[\n  {\n    "question": "Что такое кристаллы в Clash of Clans?",\n    "answer": "Кристаллы — это премиум-валюта в Clash of Clans. С их помощью можно ускорять строительство, покупать ресурсы, пропуски (Gold Pass), скины героев и многое другое."\n  },\n  {\n    "question": "Как пополнить аккаунт через вас?",\n    "answer": "Выберите нужный пакет, укажите почту от Supercell ID, оплатите заказ и отправьте код входа, который придёт на вашу почту. Мы зайдём в аккаунт и выполним покупку за вас."\n  },\n  {\n    "question": "Нужно ли вводить логин и пароль от аккаунта?",\n    "answer": "Нет, мы не просим логин или пароль. Достаточно почты от Supercell ID — код для входа приходит на неё, и вы предоставляете только этот код."\n  },\n  {\n    "question": "Насколько это безопасно?",\n    "answer": "Пополнение выполняется через официальный магазин Supercell. Мы не сохраняем данные от аккаунтов, не передаём их третьим лицам и сразу выходим после выполнения заказа."\n  },\n  {\n    "question": "Сколько времени занимает выполнение заказа?",\n    "answer": "Обычно от 5 до 15 минут после получения кода входа. В часы пик — до 1 часа."\n  },\n  {\n    "question": "Могу ли я играть в это время?",\n    "answer": "Рекомендуем не заходить в игру до завершения заказа, чтобы избежать конфликта сессий."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Вы можете оплатить заказ с помощью банковских карт (Visa, MasterCard, Мир), электронных кошельков (ЮMoney, QIWI и другие)."\n  },\n  {\n    "question": "Вы используете официальный магазин?",\n    "answer": "Да, все покупки происходят только через официальный магазин Supercell. Мы не используем сторонние источники."\n  },\n  {\n    "question": "Работаете ли вы с аккаунтами из России и СНГ?",\n    "answer": "Да, мы обслуживаем игроков со всего мира, включая Россию, Беларусь, Казахстан и другие страны СНГ."\n  }\n]	t	f
6	Clash Royale	\N	t	1️⃣ Выберите нужный товарНа странице выберите количество кристаллов, монет или пропуск, который вы хотите приобрести.\n\n2️⃣ Введите почту от Supercell IDУкажите email, к которому привязан ваш аккаунт Clash Royale. Убедитесь, что адрес указан правильно — на него придёт код входа.\n\n3️⃣ Оплатите заказНажмите «Купить» и выберите удобный способ оплаты. Мы поддерживаем банковские карты и популярные электронные кошельки.\n\n4️⃣ Отправьте код входа из письма SupercellНа вашу почту поступит 6-значный код. Отправьте его в чат заказа — мы используем его для входа и покупки.\n\n5️⃣ Ожидайте завершения заказаПожалуйста, не заходите в игру до завершения заказа. После выполнения покупки вы увидите статус «Выполнен», а донат будет уже в вашем аккаунте.	4	Clash Royale — карточная стратегическая игра в реальном времени от Supercell, где вы сражаетесь с другими игроками, используя колоды из карт юнитов, заклинаний и сооружений. Донат позволяет ускорить прокачку, открывать сундуки, покупать скины башен и боевой пропуск (Royale Pass). Всё это доступно через безопасное пополнение аккаунта.	\N	/uploads/admin/29d8c54f65014b2095a62ad17845d4a0.webp	[\n  {\n    "question": "Что даёт донат в Clash Royale?",\n    "answer": "Донат открывает доступ к кристаллам, золоту, монетам, боевому пропуску и эксклюзивным скинам. Вы можете быстрее прокачивать карты, открывать сундуки и получать награды."\n  },\n  {\n    "question": "Как пополнить аккаунт через вас?",\n    "answer": "Выберите нужный пакет, укажите почту от Supercell ID, оплатите заказ и отправьте код из письма. Мы войдём в ваш аккаунт и выполним покупку."\n  },\n  {\n    "question": "Насколько безопасно покупать донат у вас?",\n    "answer": "Очень безопасно. Мы не просим логин/пароль и не сохраняем данные. Покупки совершаются через официальный магазин Supercell."\n  },\n  {\n    "question": "Сколько времени занимает выполнение заказа?",\n    "answer": "От 5 до 15 минут после получения кода. В редких случаях — до 1 часа."\n  },\n  {\n    "question": "Какие способы оплаты поддерживаются?",\n    "answer": "Мы принимаем банковские карты (Visa, MasterCard, Мир) и популярные электронные кошельки (ЮMoney, QIWI и др.)."\n  },\n  {\n    "question": "Нужно ли быть онлайн в момент выполнения заказа?",\n    "answer": "Нет. Рекомендуем не заходить в игру, пока мы не завершили заказ, чтобы избежать конфликта сессий."\n  },\n  {\n    "question": "Что делать, если код Supercell не пришёл?",\n    "answer": "Проверьте папку "Спам". Если письма нет — повторно войдите в игру, чтобы запросить код."\n  },\n  {\n    "question": "Вы используете официальный магазин?",\n    "answer": "Да, все покупки проходят через официальную систему оплаты Supercell."\n  },\n  {\n    "question": "Вы работаете с аккаунтами из России?",\n    "answer": "Да, мы работаем со всеми регионами, включая Россию и страны СНГ."\n  },\n  {\n    "question": "Можно ли купить только боевой пропуск без кристаллов?",\n    "answer": "Да, вы можете выбрать Royale Pass как отдельный товар."\n  }\n]	t	f
7	War of Colony	\N	t	🔑 Инструкция для пополнения:\n1️⃣ Выберите нужный товар на странице\n2️⃣ Введите почту и пароль от аккаунта Nuts (учётная запись внутри игры)\n3️⃣ Оплатите покупку удобным для вас способом\n4️⃣ Мы зайдём на ваш аккаунт и приобретём необходимый донат в течение нескольких минут\n5️⃣ Если возникнут вопросы, мы свяжемся с вами через чат на сайте или в нашей поддержке в Telegram	5	War of Colony — мобильная стратегия, в которой вы становитесь командующим собственной колонией. Развивайте базы, захватывайте новые территории, создавайте армию и сражайтесь с игроками со всего мира. Улучшайте героев, добывайте ресурсы и укрепляйте своё влияние с помощью доната.	\N	/uploads/admin/9313d7f61eb84ed69c017d1b10029231.jpg	[\n  {\n    "question": "Что такое донат в War of Colony?",\n    "answer": "Донат в War of Colony позволяет быстрее развивать базу, покупать ресурсы, ускорять строительство и нанимать уникальных героев."\n  },\n  {\n    "question": "Как пополнить баланс War of Colony?",\n    "answer": "Выберите нужный товар, введите данные от аккаунта Nuts, оплатите удобным способом и отправьте нам скриншоты нужных наборов. Мы зайдём в игру и купим их за вас."\n  },\n  {\n    "question": "Безопасно ли передавать данные от аккаунта?",\n    "answer": "Да, все покупки выполняются вручную. Мы не сохраняем данные от аккаунтов и не передаём их третьим лицам."\n  },\n  {\n    "question": "Сколько времени занимает покупка доната?",\n    "answer": "Обычно процесс занимает от 5 до 15 минут после оплаты. В редких случаях ожидание может увеличиться до 1 часа."\n  },\n  {\n    "question": "Можно ли пополнить баланс из России?",\n    "answer": "Да, мы работаем со всеми регионами, включая Россию и страны СНГ."\n  },\n  {\n    "question": "Что делать, если нужный набор не отображается в магазине?",\n    "answer": "Иногда наборы появляются только во время акций. Убедитесь, что они есть в магазине перед покупкой, и пришлите нам скриншот."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Мы принимаем карты, электронные кошельки и другие популярные способы оплаты. Доступные методы зависят от вашего региона."\n  }\n]	t	f
2	PUBG Mobile	\N	t	🔑 Инструкция по пополнению через UID:\n1️⃣ Выберите нужный пакет UC (Unknown Cash)\n2️⃣ Укажите свой UID PUBG Mobile (его можно посмотреть в профиле игры)\n3️⃣ Оплатите заказ удобным способом (банковские карты, электронные кошельки и другие официальные способы)\n4️⃣ После оплаты мы моментально пополним ваш аккаунт через официальный магазин PUBG Mobile — без входа в аккаунт\n5️⃣ Обычно UC приходят на ваш аккаунт в течение нескольких минут.\n6️⃣ Если возникнут вопросы — свяжитесь с нами через чат сайта или Telegram-поддержку.	2	PUBG Mobile — популярный мобильный шутер в жанре королевской битвы. Чтобы выделяться среди игроков и ускорить развитие, вы можете пополнять UC (Unknown Cash) — игровую валюту.\nС помощью UC можно покупать крутые скины, костюмы, эмоции, пропуски Royale Pass и участвовать в эксклюзивных ивентах.\nМы поможем быстро и безопасно пополнить ваш аккаунт.\n\n⚡ Моментальная доставка — UC зачисляются сразу после оплаты (в большинстве случаев до 5 минут).\n✅ Безопасно — покупка происходит через официальный платёжный сервис PUBG Mobile, доступ к вашему аккаунту не требуется.\n💳 Официальные покупки — UC покупаются напрямую через официальные каналы, а не сторонние сервисы.\n🌎 Поддержка всех регионов, включая Россию и СНГ.\n🔒 Не нужно вводить логин и пароль — только ваш UID.	\N	/uploads/admin/b90b5b10d8f04df5b13e0929c69df984.jpg	[\n  {\n    "question": "Что такое UC в PUBG Mobile и зачем они нужны?",\n    "answer": "UC (Unknown Cash) — это премиальная валюта PUBG Mobile. С её помощью можно покупать скины для оружия, костюмы персонажей, эмоции, боевой пропуск Royale Pass и участвовать в различных ивентах."\n  },\n  {\n    "question": "Как пополнить UC через ваш сервис?",\n    "answer": "Выберите нужный пакет, укажите свой UID из PUBG Mobile и оплатите заказ. Мы моментально отправим покупку через официальный магазин, и вы получите UC на свой аккаунт."\n  },\n  {\n    "question": "Безопасно ли покупать UC через ваш сайт?",\n    "answer": "Да, пополнение происходит через официальный магазин PUBG Mobile. Мы не просим данные от вашего аккаунта и не входим в него. Покупка полностью легальна и безопасна."\n  },\n  {\n    "question": "Сколько времени занимает доставка UC?",\n    "answer": "Обычно UC приходят в течение 1–5 минут после оплаты. В редких случаях (например, при загрузке серверов PUBG) доставка может занять до 15 минут."\n  },\n  {\n    "question": "Что делать, если UC не пришли?",\n    "answer": "Проверьте правильность указанного UID. Если UC не поступили в течение 15 минут, напишите нам в поддержку через чат сайта или Telegram. Мы решим ваш вопрос максимально быстро."\n  },\n  {\n    "question": "Как узнать свой UID в PUBG Mobile?",\n    "answer": "Откройте PUBG Mobile, зайдите в профиль персонажа. UID указан под никнеймом (обычно это 8–12 цифр)."\n  },\n  {\n    "question": "Можно ли пополнить UC для аккаунтов из России и СНГ?",\n    "answer": "Да, мы обслуживаем игроков из всех стран, включая Россию, Казахстан, Беларусь и другие регионы СНГ."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Вы можете оплатить заказ банковскими картами (Visa, MasterCard, Мир), через электронные кошельки (ЮMoney, QIWI, Payeer и другие), а также другими популярными методами."\n  },\n  {\n    "question": "Эти UC официальные?",\n    "answer": "Да, все UC покупаются напрямую через официальный магазин PUBG Mobile. Это не серые схемы или сторонние сайты, а официальные покупки."\n  }\n]	t	f
8	Mobile Legends: Bang Bang	\N	t	1️⃣ Выберите нужный товар. \nНа странице выберите пакет алмазов, который хотите купить.\n\n2️⃣ Введите свой UID и Zona ID. \nОткройте игру, нажмите на ваш аватар → внизу вы увидите ваш UID (например, 12345678) и Zona ID (например, 1234). Введите эти данные при оформлении заказа.\n\n3️⃣ Оплатите заказНажмите «Купить» и выберите удобный способ оплаты. Мы поддерживаем банковские карты и электронные кошельки. Все транзакции защищены.\n\n4️⃣ Ожидайте зачисления алмазов\nПополнение выполняется через официальный магазин. Алмазы поступают на ваш аккаунт в течение 1–15 минут после оплаты.\n5️⃣ Если возникнут вопросы — напишите нам в чат на сайте или Telegram-поддержку.	6	Mobile Legends: Bang Bang — одна из самых популярных MOBA-игр на мобильных устройствах. Сражайтесь в командных битвах 5 на 5, прокачивайте героев, открывайте скины и участвуйте в ивентах. Донат позволяет покупать алмазы (diamonds), которые используются для покупки героев, скинов, эмблем, пропусков и других внутриигровых предметов.	Выбери Регион аккаунта	/uploads/admin/9734d0deabe6469aa8f125a77eeccc81.jpg	[\n  {\n    "question": "Что дают алмазы в Mobile Legends?",\n    "answer": "Алмазы — это премиум-валюта. С их помощью можно покупать скины, героев, эмблемы, пропуски и участвовать в событиях."\n  },\n  {\n    "question": "Как пополнить алмазы через ваш сервис?",\n    "answer": "Выберите нужный пакет, укажите ваш UID и Zona ID, оплатите заказ — и мы моментально отправим алмазы через официальный магазин."\n  },\n  {\n    "question": "Где найти мой UID и Zona ID?",\n    "answer": "Зайдите в игру, нажмите на аватар в левом верхнем углу. Под ником будут указаны UID и Zona ID."\n  },\n  {\n    "question": "Сколько времени занимает зачисление алмазов?",\n    "answer": "В среднем 1–5 минут после оплаты. В редких случаях — до 15 минут."\n  },\n  {\n    "question": "Вы используете официальный магазин MLBB?",\n    "answer": "Да, все покупки происходят только через официальные каналы Moonton."\n  },\n  {\n    "question": "Какие способы оплаты доступны?",\n    "answer": "Мы принимаем карты (Visa, MasterCard, Мир), а также электронные кошельки. "\n  },\n  {\n    "question": "Нужно ли входить в игру во время пополнения?",\n    "answer": "Да, вы можете находится в игре"\n  },\n  {\n    "question": "Вы работаете с аккаунтами из России и СНГ?",\n    "answer": "Да, мы обслуживаем все регионы, включая Россию, Беларусь, Казахстан и другие."\n  },\n  {\n    "question": "Насколько безопасна покупка?",\n    "answer": "Мы не просим логин/пароль от аккаунта. Все операции выполняются через официальный магазин Moonton и не несут риска для аккаунта."	t	f
10	TEST	\N	t	\N	8	\N	\N	/uploads/admin/c9e2e7beb1114764a60656f5b85906c8.png	\N	t	f
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.orders (id, user_id, game_id, product_id, manual_game_name, amount, currency, status, payment_method, transaction_id, auto_processed, comment, created_at, updated_at, payment_url) FROM stdin;
1	2	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"фыв","Пароль":"asd"}	2025-07-17 08:20:15.236154	2025-07-17 08:20:15.236156	\N
2	2	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"фыв","Пароль":"asd"}	2025-07-17 08:20:18.135446	2025-07-17 08:20:18.135447	\N
3	2	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"фыв","Пароль":"asd"}	2025-07-17 08:20:33.268743	2025-07-17 08:20:33.268745	\N
4	2	1	1	\N	600.00	RUB	pending	sberbank	\N	t	[1] {"Email":"фыв","Пароль":"asd"}	2025-07-17 08:20:38.046581	2025-07-17 08:20:38.046583	\N
5	1	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"123","Пароль":"123"}	2025-07-17 10:57:27.017901	2025-07-17 10:57:27.017903	\N
6	1	1	1	\N	600.00	RUB	pending	sberbank	\N	t	[1] {"Email":"123","Пароль":"123"}	2025-07-17 10:58:05.012603	2025-07-17 10:58:05.012606	\N
7	1	1	1	\N	600.00	RUB	pending	sberbank	\N	t	[1] {"Email":"123","Пароль":"123"}	2025-07-17 11:47:57.314186	2025-07-17 11:47:57.319255	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=600&InvId=7&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%237&SignatureValue=d2da9ff26f74839c06e283fcd91c58b8&Culture=ru&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
8	3	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"Fjk","Пароль":"Jfjf"}	2025-07-17 15:20:24.144122	2025-07-17 15:20:24.146625	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=600&InvId=8&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%238&SignatureValue=d1deafaec6ea4dc28088ac4cc2f3c5d9&Culture=ru&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
9	2	1	1	\N	600.00	RUB	pending	sbp	\N	t	[1] {"Email":"asdasd","Пароль":"asdasd"}	2025-07-18 08:46:38.575393	2025-07-18 08:46:38.59605	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=600&InvId=9&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%239&SignatureValue=870b717177a5e4de0a598fe87d90335c&Culture=ru&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
10	2	1	7	\N	10.00	RUB	processing	sbp	robokassa_10_10.000000	t	[7] {"Email":"asd","Пароль":"asd"}	2025-07-18 08:50:32.355683	2025-07-18 08:51:47.090719	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=10&InvId=10&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%2310&SignatureValue=4f813bb4029c576c8e08596aa5a7845f&Culture=ru&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
11	\N	1	7	\N	10.00	RUB	processing	sberbank	robokassa_11_10.000000	t	{"guest_email": "ziyazetdinov121219831@gmail.com", "guest_name": null, "items": [{"product_id": 7, "product_name": "test", "amount": 10.0, "comment": "{\\"Email\\":\\"ziyazetdinov121219831@gmail.com\\",\\"Пароль\\":\\"20062009\\"}"}]}\n\nДанные форм:\n[Товар #7] {"Email": "ziyazetdinov121219831@gmail.com", "Пароль": "20062009"}	2025-07-21 05:29:39.111964	2025-07-21 05:30:47.878546	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=10&InvId=11&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%2311&SignatureValue=4e899111b4dab59feda13d148cb159b2&Culture=ru&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
12	2	1	91	\N	5.00	RUB	processing	sbp	robokassa_12_5.000000	t	[91] {"Email":"фыв","Пароль":"фыв"}	2025-07-24 12:05:23.201508	2025-07-24 12:06:23.514899	https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=DonateRaidru&OutSum=5&InvId=12&Description=%D0%A3%D1%81%D0%BB%D1%83%D0%B3%D0%B0%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B5%D0%BD%D0%B8%D1%8E%20%D0%B8%D0%B3%D1%80%D0%BE%D0%B2%D0%BE%D0%B3%D0%BE%20%D0%B0%D0%BA%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20%D0%B2%20%D0%B8%D0%B3%D1%80%D0%B5%20%2312&SignatureValue=c81e19d347a13abcba8751b125e99609&Culture=ru&Receipt=%257B%2522sno%2522%253A%2520%2522usn_income%2522%252C%2520%2522items%2522%253A%2520%255B%257B%2522name%2522%253A%2520%2522%25D0%25A3%25D1%2581%25D0%25BB%25D1%2583%25D0%25B3%25D0%25B0%2520%25D0%25BF%25D0%25BE%25D0%25BF%25D0%25BE%25D0%25BB%25D0%25BD%25D0%25B5%25D0%25BD%25D0%25B8%25D1%258F%2520%25D0%25B8%25D0%25B3%25D1%2580%25D0%25BE%25D0%25B2%25D0%25BE%25D0%25B3%25D0%25BE%2520%25D0%25B0%25D0%25BA%25D0%25BA%25D0%25B0%25D1%2583%25D0%25BD%25D1%2582%25D0%25B0%2520%25D0%25B2%2520%25D0%25B8%25D0%25B3%25D1%2580%25D0%25B5%2522%252C%2520%2522quantity%2522%253A%25201%252C%2520%2522sum%2522%253A%25205.0%252C%2520%2522payment_method%2522%253A%2520%2522full_payment%2522%252C%2520%2522payment_object%2522%253A%2520%2522service%2522%252C%2520%2522tax%2522%253A%2520%2522none%2522%257D%255D%257D&SuccessURL=https%3A//donateraid.ru/api/robokassa/success&FailURL=https%3A//donateraid.ru/api/robokassa/fail
\.


--
-- Data for Name: payment_terms; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.payment_terms (id, title, description, is_required, is_active, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.products (id, game_id, name, price_rub, old_price_rub, min_amount, max_amount, type, description, instructions, enabled, delivery, sort_order, input_fields, special_note, note_type, subcategory, image_url, subcategory_id, is_deleted) FROM stdin;
6	1	Донат на 50$	5800.00	6300.00	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 50$. Указанная цена — итоговая стоимость услуги.		t	auto	10	\N	\N	warning	\N	/uploads/admin/05e0e9a89e124534a9b70ec6e3e3a6d0.jpg	\N	f
33	4	Набор за 30$	3600.00	\N	1.00	1.00	service			t	auto	6	\N	\N	warning	\N	/uploads/admin/830663e644534fbe8281ca799dc88da0.jpg	\N	f
1	1	Донат на 5$	600.00	\N	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 5$. Указанная цена — итоговая стоимость услуги.	Если вы хотите купить несколько наборов общей стоимостью, например, на 60$, выберите товары в нужной комбинации — например, 50$ + 10$.\n\nПосле оплаты у вас откроется чат с оператором, где вы сможете отправить скриншоты нужных паков. Мы зайдём на аккаунт и купим всё в точности по вашему запросу.	t	auto	1	\N	\N	warning	\N	/uploads/admin/2ddf0b45e79b4938bf61abedcff217fd.png	\N	f
2	1	Донат на 10$	1200.00	\N	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 10$. Указанная цена — итоговая стоимость услуги.	Если вы хотите купить несколько наборов общей стоимостью, например, на 60$, выберите товары в нужной комбинации — например, 50$ + 10$.\n\nПосле оплаты у вас откроется чат с оператором, где вы сможете отправить скриншоты нужных паков. Мы зайдём на аккаунт и купим всё в точности по вашему запросу.	t	auto	2	\N	\N	warning	\N	/uploads/admin/214783783b224df4872e3ce2db1d4a56.png	\N	f
4	1	Донат на 30$	3600.00	\N	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 30$. Указанная цена — итоговая стоимость услуги.		t	auto	6	\N	\N	warning	\N	/uploads/admin/e52788a12fa14dbfbc6f14cdc19b00ea.png	\N	f
17	2	660 UC	860.00	960.00	1.00	1.00	currency			t	auto	3	\N	\N	warning	\N	/uploads/admin/f3d07639576e42538de90b5ed4c68620.webp	\N	f
18	2	1800 UC	2050.00	2300.00	1.00	1.00	currency	\N	\N	t	auto	4	\N	\N	warning	\N	/uploads/admin/ee3c010cf1f64d49b7ef73643d0d1459.webp	\N	f
8	3	170 гемов	900.00	\N	1.00	1.00	currency			t	auto	1	\N	\N	warning	\N	/uploads/admin/3fb8e109477e4a9689d1e516ed7845c6.webp	1	f
9	3	360 гемов	1800.00	\N	1.00	1.00	currency			t	auto	2	\N	\N	warning	\N	/uploads/admin/3fa96ff9529d4eafb9d3997d099b6e28.webp	1	f
10	3	950 гемов	4500.00	\N	1.00	1.00	currency			t	auto	3	\N	\N	warning	\N	/uploads/admin/f66b79caa1d34bc295a83ca335fbe4d9.webp	1	f
11	3	2000 гемов	9000.00	\N	1.00	1.00	currency			t	auto	4	\N	\N	warning	\N	/uploads/admin/b6c029254d0342ea934da130c75b9937.webp	1	f
13	3	Brawl Pass Plus	900.00	\N	1.00	1.00	item			t	auto	2	\N	\N	warning	\N	/uploads/admin/18e140ad6e254220aef721d2c191e5af.webp	2	f
12	3	Brawl Pass	700.00	750.00	1.00	1.00	currency			t	auto	1	\N	\N	warning	\N	/uploads/admin/738b4e88dde44323b7312dc2cef1ea5e.webp	2	f
14	3	PRO Pass (кубок BRAWL)	2250.00	\N	1.00	1.00	item	\N	\N	t	auto	3	\N	\N	warning	\N	/uploads/admin/1b969dd1ff524c04a15bcb9a9338fb9d.webp	2	f
15	2	60 UC	85.00	110.00	1.00	1.00	currency	\N	\N	t	auto	1	\N	\N	warning	\N	/uploads/admin/1e99cd255ab44da7ba877570d0cb7697.webp	\N	f
16	2	325 UC	430.00	480.00	1.00	1.00	currency			t	auto	2	\N	\N	warning	\N	/uploads/admin/67c59e2686ea4e43ad203602c562a22a.webp	\N	f
19	2	3850 UC	4200.00	4600.00	1.00	1.00	currency			t	auto	5	\N	\N	warning	\N	/uploads/admin/5837314c21194f5583861e46677641fd.webp	\N	f
7	1	test	10.00	\N	1.00	1.00	currency	\N	\N	t	auto	1	\N	\N	warning	\N	\N	\N	t
24	5	2500 гемов	1600.00	2000.00	1.00	1.00	service			t	auto	6	\N	\N	warning	\N	/uploads/admin/716b87bc143344c5b565e43ef93f142b.webp	5	f
25	5	6500 гемов	3900.00	4500.00	1.00	1.00	service			t	auto	7	\N	\N	warning	\N	/uploads/admin/765674d93dd3460b9ba930fdb91ccaf7.webp	5	f
21	5	80 гемов	80.00	100.00	1.00	1.00	currency			t	auto	3	\N	\N	warning	\N	/uploads/admin/8db09d208fd143f38bd57eae39173268.webp	5	f
20	2	8100 UC	8700.00	9000.00	1.00	1.00	currency			t	auto	6	\N	\N	warning	\N	/uploads/admin/7272a11b597f42fab26f269577c3921f.webp	\N	f
26	5	14000 гемов	8000.00	10000.00	1.00	1.00	service			t	auto	7	\N	\N	warning	\N	/uploads/admin/918278afb6da49fca4e45f56f26a9f7b.webp	5	f
32	4	Набор за 20$	2400.00	\N	1.00	1.00	item			t	auto	4	\N	\N	warning	\N		\N	t
29	4	Набор за 5$	600.00	\N	1.00	1.00	service			t	auto	1	\N	\N	warning	\N		\N	f
27	5	Gold Pass🎫	500.00	600.00	1.00	1.00	item			t	auto	1	\N	\N	warning	\N	/uploads/admin/a43d698afda3417aa129ebf367c262de.webp	6	f
28	5	Gold Pass - особая скидка🎫	230.00	500.00	1.00	1.00	currency			t	auto	2	\N	\N	warning	\N	/uploads/admin/5fe27c2e89ad41e4aa105f4021d7e7c6.webp	6	f
30	4	Набор за 10$	1200.00	\N	1.00	1.00	service			t	auto	2	\N	\N	warning	\N	/uploads/admin/114722a9c623466281cef11842b19873.jpg	\N	f
22	5	500 гемов	400.00	500.00	1.00	1.00	currency			t	auto	4	\N	\N	warning	\N	/uploads/admin/6a69c9ef32f948f781dd318da5fb644a.webp	5	f
23	5	1200 гемов	800.00	1000.00	1.00	1.00	currency			t	auto	5	\N	\N	warning	\N	/uploads/admin/af53e16116ce452e93b9237f96bc2e6b.webp	5	f
37	4	Набор за 70$	7200.00	\N	1.00	1.00	service			t	auto	10	\N	\N	warning	\N		\N	t
47	6	80 гемов	80.00	100.00	1.00	1.00	service	\N	\N	t	auto	1	\N	\N	warning	\N	/uploads/admin/3be15955dfe04634b81eb829e00168fc.webp	\N	f
48	6	500 гемов	400.00	500.00	1.00	1.00	service			t	auto	2	\N	\N	warning	\N	/uploads/admin/b4f96e45c8b843a2847b65670ce8bdbc.webp	\N	f
50	6	2500 гемов	1600.00	2000.00	1.00	1.00	service			t	auto	4	\N	\N	warning	\N	/uploads/admin/749c0698e251405c927d5d71892782b2.webp	\N	f
51	6	6500 гемов	3900.00	4600.00	1.00	1.00	service			t	auto	5	\N	\N	warning	\N	/uploads/admin/82b566834f8547b3b611fdeb2da52877.webp	\N	f
42	7	Месячная карта🎫	600.00	\N	1.00	1.00	service			t	auto	1	\N	\N	warning	\N	/uploads/admin/568cfb31750b414da5c210669ba6fed7.png	\N	f
43	7	💎350	650.00	\N	1.00	1.00	service			t	auto	2	\N	\N	warning	\N	/uploads/admin/7a42caa6b9b14ada93568e4d03950b56.png	\N	f
44	7	💎680	1000.00	\N	1.00	1.00	service			t	auto	3	\N	\N	warning	\N	/uploads/admin/ac73b2aee40d406c837b50bd563b0424.png	\N	f
45	7	💎2450	2400.00	\N	1.00	1.00	service			t	auto	4	\N	\N	warning	\N	/uploads/admin/fb081bf6bb5447ca9215c2d702ed7c6c.png	\N	f
46	7	💎5300	4700.00	\N	1.00	1.00	service			t	auto	5	\N	\N	warning	\N	/uploads/admin/6ce35d3589314b51860ffa72d05012a8.png	\N	f
34	4	Набор за 40$	4800.00	\N	1.00	1.00	currency			t	auto	8	\N	\N	warning	\N	/uploads/admin/3cf390876b314d09aba1a8774dffec1f.jpg	\N	f
35	4	Набор за 50$	6000.00	\N	1.00	1.00	service			t	auto	10	\N	\N	warning	\N	/uploads/admin/b958566644844803bdd68c03fe9cb76e.jpg	\N	f
36	4	Набор за 60$	7200.00	\N	1.00	1.00	service			t	auto	12	\N	\N	warning	\N	/uploads/admin/2a08477a9bb74d918e411b9dbad9256b.jpg	\N	f
38	4	Набор за 70$	8400.00	\N	1.00	1.00	service			t	auto	14	\N	\N	warning	\N		\N	f
39	4	Набор за 80$	9600.00	\N	1.00	1.00	service			t	auto	16	\N	\N	warning	\N	/uploads/admin/94c1ba1bf859486f93387f2d2b62fb9e.jpg	\N	f
40	4	Набор за 90$	10800.00	\N	1.00	1.00	service			t	auto	18	\N	\N	warning	\N	/uploads/admin/d9610efe92dd4e8bb53ec41d02118417.jpg	\N	f
41	4	Набор за 100$	12000.00	\N	1.00	1.00	service			t	auto	20	\N	\N	warning	\N	/uploads/admin/2de848916b3f4cd9b6620f7f765c4ae3.jpg	\N	f
49	6	1200 гемов	800.00	1000.00	1.00	1.00	service			t	auto	3	\N	\N	warning	\N	/uploads/admin/9583fcf9ca0e46d49766af8492bfc134.webp	\N	f
71	1	Донат на 45$	5400.00	\N	1.00	1.00	currency	\N	\N	t	auto	9	\N	\N	warning	\N	/uploads/admin/c47282b2d98c405dac8d8348e4548371.jpg	\N	f
52	6	14000 гемов	8000.00	10000.00	1.00	1.00	currency			t	auto	6	\N	\N	warning	\N	/uploads/admin/547805fc291c4b10b0a55393756da114.webp	\N	f
53	8	50+5 diamonds	87.00	100.00	1.00	1.00	currency			t	auto	1	\N	\N	warning	\N	/uploads/admin/76415a77a76d40b18dbd0b4916f01b3c.webp	3	f
54	8	250+25 diamonds	435.00	549.97	1.00	1.00	currency			t	auto	2	\N	\N	warning	\N	/uploads/admin/97d347f015c24a4a80686026b76932fd.webp	3	f
55	8	500+65 diamonds	870.00	1000.00	1.00	1.00	currency	\N	\N	t	auto	3	\N	\N	warning	\N	/uploads/admin/13c5f7975e4e4e1aacc9f214cfb40176.webp	3	f
57	8	1500+270 diamonds	2600.00	3200.00	1.00	1.00	currency	\N	\N	t	auto	5	\N	\N	warning	\N	/uploads/admin/444968937b5e4500b5e5b1350335f3f6.webp	3	f
60	8	5000+1000 diamonds	8700.00	10499.99	1.00	1.00	currency			t	auto	8	\N	\N	warning	\N	/uploads/admin/c31f04c5a971472d974ee5b3560bf41d.webp	3	f
56	8	1000+160 diamonds	1750.00	2199.97	1.00	1.00	currency			t	auto	4	\N	\N	warning	\N	/uploads/admin/ef0282e190844031a15c5e3069e8f803.webp	3	f
59	8	3500+665 diamonds	5450.00	6500.00	1.00	1.00	currency			t	auto	7	\N	\N	warning	\N	/uploads/admin/1b01be614aa34343b3f66a37092b6b1c.webp	3	f
58	8	2500+475 diamonds	4350.00	5199.99	1.00	1.00	currency			t	auto	6	\N	\N	warning	\N	/uploads/admin/1fba427df9654ea5bedea65b67319219.webp	3	f
61	9	60 кристаллов	85.00	100.00	1.00	1.00	currency			t	auto	1	\N	\N	warning	\N	/uploads/admin/00f1ea39abfa4d6ba2fa540a0a533f48.png	\N	f
62	9	300+30 кристаллов	430.00	520.00	1.00	1.00	currency			t	auto	2	\N	\N	warning	\N	/uploads/admin/9cdddb89954040a58dbbd6d3ee7496e6.png	\N	f
63	9	980+110 кристаллов	1300.00	1600.00	1.00	1.00	currency			t	auto	3	\N	\N	warning	\N	/uploads/admin/69f182f3e36147a7b21b2fca5fd0713c.png	\N	f
64	9	1980+260 кристаллов	2700.00	3500.00	1.00	1.00	currency	\N	\N	t	auto	4	\N	\N	warning	\N	/uploads/admin/ef77cc7a7f9a41829db23c77a0f464b7.png	\N	f
65	9	3280+600 кристаллов	4100.00	5000.00	1.00	1.00	currency	\N	\N	t	auto	5	\N	\N	warning	\N	/uploads/admin/e4603d520664452f85f1c1624a879b61.png	\N	f
66	9	6480+1000 кристаллов	8200.00	10000.00	1.00	1.00	currency	\N	\N	t	auto	6	\N	\N	warning	\N	/uploads/admin/22603881de3a448eb94739e67fb4a137.png	\N	f
67	9	Благословение полой луны	420.00	500.00	1.00	1.00	currency	\N	\N	t	auto	7	\N	\N	warning	\N	/uploads/admin/47a4060b2daa43e8b350a6a3981fd29c.png	\N	f
68	1	Донат на 15$	1800.00	\N	1.00	1.00	currency	\N	\N	t	auto	3	\N	\N	warning	\N	/uploads/admin/afc5a2cf90df4746b85c08c14be219db.jpg	\N	f
3	1	Донат на 20$	2400.00	\N	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 20$. Указанная цена — итоговая стоимость услуги.	Если вы хотите купить несколько наборов общей стоимостью, например, на 60$, выберите товары в нужной комбинации — например, 50$ + 10$.\n\nПосле оплаты у вас откроется чат с оператором, где вы сможете отправить скриншоты нужных паков. Мы зайдём на аккаунт и купим всё в точности по вашему запросу.	t	auto	4	\N	\N	warning	\N	/uploads/admin/573f614e9555483eb946910e0b65c73c.png	\N	f
69	1	Донат на 25$	3000.00	\N	1.00	1.00	currency			t	auto	5	\N	\N	warning	\N	/uploads/admin/35267a8948e74f58bd8c6cfe43fc8b40.jpg	\N	f
70	1	Донат на 35$	4200.00	\N	1.00	1.00	currency			t	auto	7	\N	\N	warning	\N	/uploads/admin/68b2261c2f074b00baaacd34f6f2faab.jpg	\N	f
5	1	Донат на 40$	4700.00	5500.00	1.00	1.00	currency	После оплаты мы зайдём на ваш аккаунт и купим внутриигровой набор на сумму 10$. Указанная цена — итоговая стоимость услуги.		t	auto	8	\N	\N	warning	\N	/uploads/admin/b5efdd75becc4c3fb3dc3b1b77ce02ce.jpg	\N	f
72	1	Донат на 55$	6600.00	\N	1.00	1.00	currency	\N	\N	t	auto	11	\N	\N	warning	\N	/uploads/admin/21dd2e252d9447bf9866091252baf4da.jpg	\N	f
73	1	Донат на 60$	7200.00	\N	1.00	1.00	currency	\N	\N	t	auto	12	\N	\N	warning	\N	/uploads/admin/048a3c0fc41042a7bf7514662b4c82e8.jpg	\N	f
74	1	Донат на 65$	7800.00	\N	1.00	1.00	currency			t	auto	13	\N	\N	warning	\N	/uploads/admin/4a4ae526df59430cab201b291c319b41.jpg	\N	f
75	1	Донат на 70$	8400.00	\N	1.00	1.00	currency	\N	\N	t	auto	14	\N	\N	warning	\N	\N	\N	f
76	1	Донат на 75$	9000.00	\N	1.00	1.00	currency	\N	\N	t	auto	15	\N	\N	warning	\N	\N	\N	f
77	1	Донат на 80$	9600.00	\N	1.00	1.00	currency	\N	\N	t	auto	16	\N	\N	warning	\N	/uploads/admin/5405cc69da244239b82a247e54b7fb78.jpg	\N	f
78	1	Донат на 85$	10200.00	\N	1.00	1.00	currency	\N	\N	t	auto	17	\N	\N	warning	\N	\N	\N	f
79	1	Донат на 90$	10800.00	\N	1.00	1.00	currency	\N	\N	t	auto	18	\N	\N	warning	\N	/uploads/admin/488c2935fb48441daf1a59f49f35965a.jpg	\N	f
80	1	Донат на 95$	11400.00	\N	1.00	1.00	currency	\N	\N	t	auto	19	\N	\N	warning	\N	\N	\N	f
81	1	Донат на 100$	12000.00	\N	1.00	1.00	currency	\N	\N	t	auto	20	\N	\N	warning	\N	/uploads/admin/67486ed1e97e4daa85142ab03d6f3a07.jpg	\N	f
82	4	Набор за 15$	1800.00	\N	1.00	1.00	currency	\N	\N	t	auto	3	\N	\N	warning	\N	/uploads/admin/abb1ca30599b4d0aaee7754787302d0d.jpg	\N	f
31	4	Набор за 20$	2400.00	\N	1.00	1.00	service			t	auto	4	\N	\N	warning	\N	/uploads/admin/05c665aca39b44f4ae72b85f57698fa6.jpg	\N	f
83	4	Набор за 25$	3000.00	\N	1.00	1.00	currency			t	auto	5	\N	\N	warning	\N	/uploads/admin/fa3a0bc53d2746588d02158a41806433.jpg	\N	f
84	4	Набор за 35$	4200.00	\N	1.00	1.00	currency			t	auto	7	\N	\N	warning	\N	/uploads/admin/1f6c7dd31d504e92a1cac5f9635c92d3.jpg	\N	f
85	4	Набор за 45$	5400.00	\N	1.00	1.00	currency			t	auto	9	\N	\N	warning	\N	/uploads/admin/d178e61b86344c18b062788b59fc1d51.jpg	\N	f
86	4	Набор за 55$	6600.00	\N	1.00	1.00	currency			t	auto	11	\N	\N	warning	\N	/uploads/admin/c8722b6f584c444db465d4b60b21c289.jpg	\N	f
87	4	Набор за 65$	7800.00	\N	1.00	1.00	currency			t	auto	13	\N	\N	warning	\N	/uploads/admin/49e4a2f383bd4aae8d8aea5564cc3c2e.jpg	\N	f
88	4	Набор за 75$	9000.00	\N	1.00	1.00	currency			t	auto	15	\N	\N	warning	\N		\N	f
89	4	Набор за 85$	10200.00	\N	1.00	1.00	currency			t	auto	17	\N	\N	warning	\N		\N	f
90	4	Набор за 95$	11400.00	\N	1.00	1.00	currency			t	auto	19	\N	\N	warning	\N		\N	f
91	1	Тестовый товар	5.00	\N	1.00	1.00	currency	Tested	\N	t	auto	1	\N	\N	warning	\N	\N	\N	f
\.


--
-- Data for Name: referral_earnings; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.referral_earnings (id, referrer_id, referred_user_id, order_id, amount, percentage, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.reviews (id, order_id, rating, text, email, game_name, is_approved, is_anonymous, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.support_messages (id, user_id, message, is_from_user, created_at, status, admin_id, thread_id, guest_id) FROM stdin;
2	2	Привет	f	2025-07-17 08:26:03.550758	in_progress	\N	\N	\N
1	2	Привет	t	2025-07-17 08:25:58.847426	in_progress	\N	\N	\N
3	\N	время работы?	t	2025-07-19 23:27:37.134176	new	\N	\N	guest_1ejvniqfkxk_1752967601269
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, telegram_id, username, email, balance, role, referral_code, referred_by_id, referral_earnings, total_referrals, created_at, password_hash) FROM stdin;
2	\N	\N	jason19679@gmail.com	0.00	admin	REF3W1ZKBEP	\N	0.00	0	2025-07-17 07:56:40.649615	\N
1	\N	\N	kvpelvne@gmail.com	0.00	admin	REF35XELP4O	\N	0.00	0	2025-07-16 14:36:17.344794	\N
3	\N	\N	Jason19679@gmail.com	0.00	user	REFJIPTKPRF	\N	0.00	0	2025-07-17 15:19:16.347355	\N
4	\N	\N	net.valen81@mail.ru	0.00	user	REF0UJKQXMS	\N	0.00	0	2025-07-18 17:31:28.295569	\N
5	\N	\N	i83.1-57@yandex.ru	0.00	user	REF28QT7B4S	\N	0.00	0	2025-07-19 05:56:09.933769	\N
6	\N	\N	apollos1380@gmail.com	0.00	admin	REFEP820G93	\N	0.00	0	2025-07-21 06:20:19.641255	\N
\.


--
-- Name: article_tags_table_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.article_tags_table_id_seq', 4, true);


--
-- Name: articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.articles_id_seq', 1, true);


--
-- Name: auth_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.auth_tokens_id_seq', 10, true);


--
-- Name: game_faqs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.game_faqs_id_seq', 1, false);


--
-- Name: game_input_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.game_input_fields_id_seq', 36, true);


--
-- Name: game_instructions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.game_instructions_id_seq', 1, false);


--
-- Name: game_subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.game_subcategories_id_seq', 6, true);


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.games_id_seq', 10, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.orders_id_seq', 12, true);


--
-- Name: payment_terms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.payment_terms_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.products_id_seq', 91, true);


--
-- Name: referral_earnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.referral_earnings_id_seq', 1, false);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.support_messages_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: article_tags article_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_pkey PRIMARY KEY (article_id, tag_id);


--
-- Name: article_tags_table article_tags_table_name_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags_table
    ADD CONSTRAINT article_tags_table_name_key UNIQUE (name);


--
-- Name: article_tags_table article_tags_table_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags_table
    ADD CONSTRAINT article_tags_table_pkey PRIMARY KEY (id);


--
-- Name: article_tags_table article_tags_table_slug_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags_table
    ADD CONSTRAINT article_tags_table_slug_key UNIQUE (slug);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_slug_key UNIQUE (slug);


--
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: game_faqs game_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_faqs
    ADD CONSTRAINT game_faqs_pkey PRIMARY KEY (id);


--
-- Name: game_input_fields game_input_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_input_fields
    ADD CONSTRAINT game_input_fields_pkey PRIMARY KEY (id);


--
-- Name: game_instructions game_instructions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_instructions
    ADD CONSTRAINT game_instructions_pkey PRIMARY KEY (id);


--
-- Name: game_subcategories game_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_subcategories
    ADD CONSTRAINT game_subcategories_pkey PRIMARY KEY (id);


--
-- Name: games games_name_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_name_key UNIQUE (name);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_terms payment_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.payment_terms
    ADD CONSTRAINT payment_terms_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: referral_earnings referral_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: reviews uix_reviews_order_id; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT uix_reviews_order_id UNIQUE (order_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_telegram_id_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telegram_id_key UNIQUE (telegram_id);


--
-- Name: ix_article_tags_table_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_article_tags_table_id ON public.article_tags_table USING btree (id);


--
-- Name: ix_articles_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_articles_id ON public.articles USING btree (id);


--
-- Name: ix_auth_tokens_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_auth_tokens_id ON public.auth_tokens USING btree (id);


--
-- Name: ix_auth_tokens_token; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_auth_tokens_token ON public.auth_tokens USING btree (token);


--
-- Name: ix_game_faqs_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_game_faqs_id ON public.game_faqs USING btree (id);


--
-- Name: ix_game_input_fields_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_game_input_fields_id ON public.game_input_fields USING btree (id);


--
-- Name: ix_game_instructions_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_game_instructions_id ON public.game_instructions USING btree (id);


--
-- Name: ix_game_subcategories_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_game_subcategories_id ON public.game_subcategories USING btree (id);


--
-- Name: ix_games_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_games_id ON public.games USING btree (id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_payment_terms_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_payment_terms_id ON public.payment_terms USING btree (id);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_referral_earnings_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_referral_earnings_id ON public.referral_earnings USING btree (id);


--
-- Name: ix_referral_earnings_order_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_referral_earnings_order_id ON public.referral_earnings USING btree (order_id);


--
-- Name: ix_referral_earnings_referrer_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_referral_earnings_referrer_id ON public.referral_earnings USING btree (referrer_id);


--
-- Name: ix_reviews_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_reviews_id ON public.reviews USING btree (id);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_referral_code; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX ix_users_referral_code ON public.users USING btree (referral_code);


--
-- Name: article_tags article_tags_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id);


--
-- Name: article_tags article_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.article_tags
    ADD CONSTRAINT article_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.article_tags_table(id);


--
-- Name: articles articles_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: auth_tokens auth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: game_faqs game_faqs_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_faqs
    ADD CONSTRAINT game_faqs_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: game_input_fields game_input_fields_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_input_fields
    ADD CONSTRAINT game_input_fields_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_input_fields game_input_fields_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_input_fields
    ADD CONSTRAINT game_input_fields_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.game_subcategories(id) ON DELETE CASCADE;


--
-- Name: game_instructions game_instructions_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_instructions
    ADD CONSTRAINT game_instructions_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: game_subcategories game_subcategories_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.game_subcategories
    ADD CONSTRAINT game_subcategories_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: orders orders_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id);


--
-- Name: orders orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: products products_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: products products_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.game_subcategories(id) ON DELETE SET NULL;


--
-- Name: referral_earnings referral_earnings_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: referral_earnings referral_earnings_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id);


--
-- Name: referral_earnings referral_earnings_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: support_messages support_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_referred_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

