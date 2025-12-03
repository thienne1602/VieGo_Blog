# -*- coding: utf-8 -*-
"""Utilities to build detailed content for VieGo tours."""

from __future__ import annotations

from textwrap import dedent
from typing import Any, Dict, List
import unicodedata

LocationProfile = Dict[str, Any]


LOCATION_PROFILES: Dict[str, LocationProfile] = {
    "Hà Giang": {
        "region": "Đông Bắc",
        "nickname": "cao nguyên đá Đồng Văn",
        "tagline": "đèo Mã Pí Lèng và sắc hoa tam giác mạch",
        "aliases": ["Ha Giang", "Dong Van"],
        "landmarks": [
            "Đèo Mã Pí Lèng",
            "Cột cờ Lũng Cú",
            "Phố cổ Đồng Văn",
        ],
        "nature_spots": [
            "Sông Nho Quế",
            "Thung lũng Sủng Là",
            "cao nguyên đá tai mèo",
        ],
        "cultural_experiences": [
            "chợ phiên vùng cao",
            "làng người Lô Lô Chải",
            "lễ hội khèn Mông",
        ],
        "culinary": [
            "thắng cố",
            "bánh tam giác mạch",
            "rượu ngô men lá",
        ],
        "souvenirs": ["mật ong bạc hà", "lanh dệt tay"],
    },
    "Cao Bằng": {
        "region": "Đông Bắc",
        "nickname": "miền thác nước tráng lệ",
        "tagline": "thác Bản Giốc và động Ngườm Ngao",
        "aliases": ["Cao Bang"],
        "landmarks": [
            "Thác Bản Giốc",
            "Động Ngườm Ngao",
            "Suối Lê Nin - hang Pác Bó",
        ],
        "nature_spots": [
            "Sông Quây Sơn",
            "Núi Phia Oắc",
            "Hồ Thang Hen",
        ],
        "cultural_experiences": [
            "làng nghề rèn Phúc Sen",
            "bản Khuổi Ky",
            "ẩm thực người Tày",
        ],
        "culinary": [
            "vịt quay 7 vị",
            "bánh áp chao",
            "phở chua Cao Bằng",
        ],
        "souvenirs": ["miến dong Phia Đén", "thổ cẩm người Tày"],
    },
    "Sa Pa": {
        "region": "Tây Bắc",
        "nickname": "thị trấn trong mây",
        "tagline": "Fansipan và bản làng người H'Mông",
        "aliases": ["Sapa", "Sa Pa", "Lào Cai"],
        "landmarks": [
            "Sun World Fansipan Legend",
            "Nhà thờ đá Sa Pa",
            "Bản Cát Cát",
        ],
        "nature_spots": [
            "Thung lũng Mường Hoa",
            "Đồi mâm xôi",
            "Thác Bạc",
        ],
        "cultural_experiences": [
            "chợ đêm Sa Pa",
            "bản Tả Van",
            "chợ phiên Bắc Hà",
        ],
        "culinary": [
            "cá hồi Sa Pa",
            "lợn bản nướng",
            "thắng cố thảo mộc",
        ],
        "souvenirs": ["thổ cẩm H'Mông", "trà shan tuyết"],
    },
    "Ninh Bình": {
        "region": "Bắc Bộ",
        "nickname": "vịnh Hạ Long trên cạn",
        "tagline": "Tràng An, Tam Cốc và cố đô Hoa Lư",
        "aliases": ["Ninh Binh"],
        "landmarks": [
            "Quần thể Tràng An",
            "Tam Cốc - Bích Động",
            "Cố đô Hoa Lư",
        ],
        "nature_spots": [
            "Đầm Vân Long",
            "Rừng Cúc Phương",
            "Hang Múa",
        ],
        "cultural_experiences": [
            "chùa Bái Đính",
            "làng đá mỹ nghệ Ninh Vân",
            "lễ hội Trường Yên",
        ],
        "culinary": [
            "cơm cháy dê núi",
            "miến lươn",
            "ốc núi luộc",
        ],
        "souvenirs": ["đá mỹ nghệ", "rượu Kim Sơn"],
    },
    "Hạ Long": {
        "region": "Quảng Ninh",
        "nickname": "di sản thiên nhiên thế giới",
        "tagline": "hang động kỳ ảo và du thuyền sang trọng",
        "aliases": ["Ha Long", "Quang Ninh"],
        "landmarks": [
            "Động Thiên Cung",
            "Hang Sửng Sốt",
            "Đảo Titop",
        ],
        "nature_spots": [
            "Vịnh Bái Tử Long",
            "Làng chài Cửa Vạn",
            "Bán đảo Tuần Châu",
        ],
        "cultural_experiences": [
            "bảo tàng Quảng Ninh",
            "làng ngọc trai Tùng Sâu",
            "chợ Hạ Long 1",
        ],
        "culinary": [
            "chả mực",
            "sá sùng nướng",
            "sam biển hấp",
        ],
        "souvenirs": ["ngọc trai", "hải sản khô"],
    },
    "Hà Nội": {
        "region": "Bắc Bộ",
        "nickname": "Thủ đô ngàn năm",
        "tagline": "phố cổ và di sản ẩm thực",
        "aliases": ["Ha Noi", "Hanoi", "Hoan Kiem"],
        "landmarks": [
            "Hồ Hoàn Kiếm",
            "Văn Miếu - Quốc Tử Giám",
            "Phố cổ 36 phố phường",
        ],
        "nature_spots": [
            "Hồ Tây",
            "Làng gốm Bát Tràng",
            "Làng lụa Vạn Phúc",
        ],
        "cultural_experiences": [
            "múa rối nước Thăng Long",
            "chợ đêm Hoàn Kiếm",
            "cà phê trứng phố cổ",
        ],
        "culinary": [
            "phở bò",
            "bún chả",
            "cà phê trứng",
        ],
        "souvenirs": ["gốm Bát Tràng", "lụa Vạn Phúc"],
    },
    "Huế": {
        "region": "Miền Trung",
        "nickname": "kinh thành cổ",
        "tagline": "Đại Nội và lăng tẩm triều Nguyễn",
        "aliases": ["Hue"],
        "landmarks": [
            "Đại Nội Huế",
            "Lăng Khải Định",
            "Chùa Thiên Mụ",
        ],
        "nature_spots": [
            "Sông Hương",
            "Đầm Lập An",
            "Bãi biển Thuận An",
        ],
        "cultural_experiences": [
            "ca Huế trên sông Hương",
            "làng hương Thủy Xuân",
            "làng nón Tây Hồ",
        ],
        "culinary": [
            "bún bò Huế",
            "bánh bèo - nậm - lọc",
            "chè cung đình",
        ],
        "souvenirs": ["nón lá bài thơ", "trầm hương"],
    },
    "Đà Nẵng": {
        "region": "Miền Trung",
        "nickname": "thành phố đáng sống",
        "tagline": "cầu Vàng và bán đảo Sơn Trà",
        "aliases": ["Da Nang"],
        "landmarks": [
            "Bà Nà Hills",
            "Cầu Vàng",
            "Ngũ Hành Sơn",
        ],
        "nature_spots": [
            "Bán đảo Sơn Trà",
            "Bãi biển Mỹ Khê",
            "Đèo Hải Vân",
        ],
        "cultural_experiences": [
            "chợ Hàn",
            "bảo tàng Điêu khắc Chăm",
            "làng đá mỹ nghệ Non Nước",
        ],
        "culinary": [
            "mì Quảng",
            "bánh tráng cuốn thịt heo",
            "hải sản nướng",
        ],
        "souvenirs": ["chả bò", "đá mỹ nghệ"],
    },
    "Hội An": {
        "region": "Quảng Nam",
        "nickname": "phố cổ đèn lồng",
        "tagline": "di sản UNESCO đầy sức sống",
        "aliases": ["Hoi An"],
        "landmarks": [
            "Chùa Cầu",
            "Nhà cổ Tấn Ký",
            "Hội quán Phúc Kiến",
        ],
        "nature_spots": [
            "Bãi biển An Bàng",
            "Rừng dừa Bảy Mẫu",
            "Cù Lao Chàm",
        ],
        "cultural_experiences": [
            "lớp làm đèn lồng",
            "chợ đêm Nguyễn Hoàng",
            "làng gốm Thanh Hà",
        ],
        "culinary": [
            "cao lầu",
            "mì Quảng",
            "bánh bao - bánh vạc",
        ],
        "souvenirs": ["đèn lồng lụa", "đồ da thủ công"],
    },
    "Nha Trang": {
        "region": "Khánh Hòa",
        "nickname": "thành phố biển",
        "tagline": "vịnh Nha Trang và những hòn đảo ngọc",
        "aliases": ["Nha Trang", "Khanh Hoa"],
        "landmarks": [
            "Tháp Bà Ponagar",
            "Làng Yến Mai Sinh",
            "Vega City Nha Trang",
        ],
        "nature_spots": [
            "Bãi biển Dốc Lết",
            "Hòn Tre",
            "Suối khoáng I-resort",
        ],
        "cultural_experiences": [
            "chùa Long Sơn",
            "Nha Trang Xưa",
            "chợ Đầm",
        ],
        "culinary": [
            "bún sứa",
            "yến sào",
            "nem nướng Ninh Hòa",
        ],
        "souvenirs": ["yến sào cao cấp", "hải sản khô"],
    },
    "Đà Lạt": {
        "region": "Tây Nguyên",
        "nickname": "thành phố sương mù",
        "tagline": "đồi thông và hồ Xuân Hương lãng mạn",
        "aliases": ["Da Lat"],
        "landmarks": [
            "Quảng trường Lâm Viên",
            "Ga Đà Lạt",
            "Dinh III Bảo Đại",
        ],
        "nature_spots": [
            "Hồ Xuân Hương",
            "Thác Datanla",
            "Đồi Robin",
        ],
        "cultural_experiences": [
            "làng Cù Lần",
            "làng hoa Vạn Thành",
            "chợ đêm Đà Lạt",
        ],
        "culinary": [
            "lẩu gà lá é",
            "bánh ướt lòng gà",
            "sữa đậu nành nóng",
        ],
        "souvenirs": ["mứt Đà Lạt", "hoa khô nghệ thuật"],
    },
    "Mũi Né": {
        "region": "Bình Thuận",
        "nickname": "thủ phủ resort",
        "tagline": "đồi cát bay và làng chài trù phú",
        "aliases": ["Mui Ne", "Phan Thiet"],
        "landmarks": [
            "Đồi cát đỏ",
            "Suối Tiên",
            "Làng chài Mũi Né",
        ],
        "nature_spots": [
            "Đồi cát trắng Bàu Trắng",
            "Bãi biển Mũi Né",
            "Hòn Rơm",
        ],
        "cultural_experiences": [
            "chợ hải sản ven biển",
            "lễ hội Cầu Ngư",
            "làng chài Hàm Tiến",
        ],
        "culinary": [
            "gỏi cá mai",
            "bánh căn",
            "hải sản nướng",
        ],
        "souvenirs": ["nước mắm Phan Thiết", "thanh long sấy"],
    },
    "TP. Hồ Chí Minh": {
        "region": "Nam Bộ",
        "nickname": "đô thị không ngủ",
        "tagline": "phố đi bộ Nguyễn Huệ và chợ Bến Thành",
        "aliases": ["Ho Chi Minh City", "Sai Gon", "TP Ho Chi Minh"],
        "landmarks": [
            "Nhà thờ Đức Bà",
            "Bưu điện Trung tâm",
            "Dinh Độc Lập",
        ],
        "nature_spots": [
            "Bến Bạch Đằng",
            "Thảo Cầm Viên",
            "Cần Giờ",
        ],
        "cultural_experiences": [
            "phố đi bộ Nguyễn Huệ",
            "chợ Bến Thành",
            "Bảo tàng Áo Dài",
        ],
        "culinary": [
            "cơm tấm",
            "hủ tiếu gõ",
            "cà phê sữa đá",
        ],
        "souvenirs": ["kẹo dừa", "đồ da thủ công"],
    },
    "Cần Thơ": {
        "region": "Đồng bằng sông Cửu Long",
        "nickname": "Tây Đô gạo trắng nước trong",
        "tagline": "chợ nổi Cái Răng và bến Ninh Kiều",
        "aliases": ["Can Tho"],
        "landmarks": [
            "Bến Ninh Kiều",
            "Chợ nổi Cái Răng",
            "Thiền viện Trúc Lâm Phương Nam",
        ],
        "nature_spots": [
            "Vườn cò Bằng Lăng",
            "miệt vườn Phong Điền",
            "sông Hậu",
        ],
        "cultural_experiences": [
            "nhà cổ Bình Thủy",
            "đờn ca tài tử",
            "làng du lịch Mỹ Khánh",
        ],
        "culinary": [
            "lẩu mắm",
            "bánh xèo củ hủ dừa",
            "trái cây miệt vườn",
        ],
        "souvenirs": ["bánh tét lá cẩm", "kẹo dừa Cái Răng"],
    },
    "Phú Quốc": {
        "region": "Kiên Giang",
        "nickname": "đảo ngọc",
        "tagline": "bãi Sao và hoàng hôn Sunset Town",
        "aliases": ["Phu Quoc", "Kien Giang"],
        "landmarks": [
            "Nhà tù Phú Quốc",
            "Thị trấn Hoàng Hôn",
            "Grand World",
        ],
        "nature_spots": [
            "Bãi Sao",
            "Hòn Thơm",
            "Rừng nguyên sinh Bắc đảo",
        ],
        "cultural_experiences": [
            "vườn tiêu Khu Tượng",
            "làng chài Hàm Ninh",
            "nhà thùng nước mắm",
        ],
        "culinary": [
            "hải sản tươi sống",
            "ghẹ Hàm Ninh",
            "rượu sim",
        ],
        "souvenirs": ["nước mắm Phú Quốc", "ngọc trai"],
    },
    "Côn Đảo": {
        "region": "Bà Rịa - Vũng Tàu",
        "nickname": "hòn đảo thiêng",
        "tagline": "di tích lịch sử và bãi Đầm Trầu",
        "aliases": ["Con Dao"],
        "landmarks": [
            "Bảo tàng Côn Đảo",
            "Nghĩa trang Hàng Dương",
            "Hệ thống nhà tù",
        ],
        "nature_spots": [
            "Bãi Đầm Trầu",
            "Hòn Bảy Cạnh",
            "Rừng Ông Đụng",
        ],
        "cultural_experiences": [
            "lễ tưởng niệm nữ anh hùng Võ Thị Sáu",
            "chợ đêm Côn Đảo",
            "làng chài Cỏ Ống",
        ],
        "culinary": [
            "mắm nhum",
            "ốc vú nàng",
            "hải sản nướng lá chuối",
        ],
        "souvenirs": ["hải sản khô", "ngọc trai Côn Đảo"],
    },
    "Buôn Ma Thuột": {
        "region": "Đắk Lắk",
        "nickname": "thủ phủ cà phê",
        "tagline": "buôn làng Ê Đê và thác Dray Nur",
        "aliases": ["Buon Ma Thuot", "Dak Lak"],
        "landmarks": [
            "Bảo tàng Thế giới Cà phê",
            "Buôn Đôn",
            "Làng cà phê Trung Nguyên",
        ],
        "nature_spots": [
            "Thác Dray Nur",
            "Hồ Lắk",
            "Vườn quốc gia Yok Đôn",
        ],
        "cultural_experiences": [
            "nhà dài Ê Đê",
            "cồng chiêng Tây Nguyên",
            "lễ hội cà phê",
        ],
        "culinary": [
            "cà phê phin đặc sản",
            "bò một nắng",
            "cơm lam gà nướng",
        ],
        "souvenirs": ["cà phê rang xay", "đồ da thủ công"],
    },
    "Quy Nhơn": {
        "region": "Bình Định",
        "nickname": "thiên đường biển xanh",
        "tagline": "Eo Gió và Kỳ Co quyến rũ",
        "aliases": ["Quy Nhon", "Binh Dinh"],
        "landmarks": [
            "Eo Gió",
            "Bãi Kỳ Co",
            "Tháp Đôi Chăm Pa",
        ],
        "nature_spots": [
            "Đảo Hòn Khô",
            "Đầm Thị Nại",
            "Biển Trung Lương",
        ],
        "cultural_experiences": [
            "võ cổ truyền Bình Định",
            "làng nghề nón Ngũ Phụng",
            "lễ hội Tây Sơn",
        ],
        "culinary": [
            "bánh xèo tôm nhảy",
            "bún chả cá",
            "mực rim tỏi ớt",
        ],
        "souvenirs": ["rượu Bàu Đá", "hải sản phơi khô"],
    },
    "Phú Yên": {
        "region": "Duyên hải Nam Trung Bộ",
        "nickname": "xứ hoa vàng cỏ xanh",
        "tagline": "Gành Đá Đĩa và Mũi Điện đón bình minh",
        "aliases": ["Phu Yen"],
        "landmarks": [
            "Gành Đá Đĩa",
            "Mũi Đại Lãnh",
            "Nhà thờ Mằng Lăng",
        ],
        "nature_spots": [
            "Đầm Ô Loan",
            "Vịnh Xuân Đài",
            "cao nguyên Vân Hòa",
        ],
        "cultural_experiences": [
            "lễ hội đua thuyền",
            "làng nghề dệt chiếu Phú Tân",
            "ẩm thực cá ngừ đại dương",
        ],
        "culinary": [
            "mắt cá ngừ đại dương",
            "bánh canh hẹ",
            "chả dông",
        ],
        "souvenirs": ["yến sào", "bánh tráng Hòa Đa"],
    },
    "Quảng Bình": {
        "region": "Bắc Trung Bộ",
        "nickname": "vương quốc hang động",
        "tagline": "Phong Nha - Kẻ Bàng huyền bí",
        "aliases": ["Quang Binh", "Dong Hoi"],
        "landmarks": [
            "Động Phong Nha",
            "Hang Tiên",
            "Suối nước Moọc",
        ],
        "nature_spots": [
            "Biển Nhật Lệ",
            "rừng nguyên sinh",
            "thung lũng sinh thái",
        ],
        "cultural_experiences": [
            "nhà thờ Tam Tòa",
            "lễ hội cầu ngư Bảo Ninh",
            "làng biển Quảng Phúc",
        ],
        "culinary": [
            "cháo canh",
            "bánh bột lọc",
            "khoai deo",
        ],
        "souvenirs": ["mực một nắng", "cam Quảng Bình"],
    },
    "Mộc Châu": {
        "region": "Sơn La",
        "nickname": "cao nguyên chè",
        "tagline": "đồi chè trái tim và đồi thông bản Áng",
        "aliases": ["Moc Chau"],
        "landmarks": [
            "Đồi chè trái tim",
            "Thác Dải Yếm",
            "Đồi thông bản Áng",
        ],
        "nature_spots": [
            "Thung lũng Nà Ka",
            "đồi mận Mu Náu",
            "cao nguyên xanh",
        ],
        "cultural_experiences": [
            "bản người Thái",
            "lễ hội Hết Chá",
            "trải nghiệm nông trại bò sữa",
        ],
        "culinary": [
            "bê chao",
            "cá suối nướng",
            "sữa chua dẻo",
        ],
        "souvenirs": ["chè Ô Long", "sữa bò Mộc Châu"],
    },
    "Mai Châu": {
        "region": "Hòa Bình",
        "nickname": "thung lũng bản Lác",
        "tagline": "nhà sàn người Thái và ruộng bậc thang",
        "aliases": ["Mai Chau"],
        "landmarks": [
            "Bản Lác",
            "Hang Chiều",
            "cánh đồng lúa Mai Châu",
        ],
        "nature_spots": [
            "Đèo Thung Khe",
            "thác Gò Lào",
            "thung lũng xanh",
        ],
        "cultural_experiences": [
            "múa xòe Thái",
            "dệt thổ cẩm",
            "ẩm thực cơm lam",
        ],
        "culinary": [
            "cơm lam",
            "lợn bản nướng",
            "rượu cần",
        ],
        "souvenirs": ["thổ cẩm", "mật ong rừng"],
    },
    "Tam Đảo": {
        "region": "Vĩnh Phúc",
        "nickname": "Đà Lạt miền Bắc",
        "tagline": "thị trấn mờ sương và nhà thờ đá",
        "aliases": ["Tam Dao"],
        "landmarks": [
            "Nhà thờ đá Tam Đảo",
            "Quảng trường gió",
            "Cầu Mây",
        ],
        "nature_spots": [
            "Vườn quốc gia Tam Đảo",
            "thác Bạc",
            "rừng thông",
        ],
        "cultural_experiences": [
            "chợ đêm Tam Đảo",
            "lễ hội Tây Thiên",
            "làng nghề mây tre",
        ],
        "culinary": [
            "gà đồi nướng",
            "su su xanh",
            "lẩu ngọn su su",
        ],
        "souvenirs": ["trà hoa", "rượu su su"],
    },
    "Ba Vì": {
        "region": "Hà Nội",
        "nickname": "lá phổi xanh thủ đô",
        "tagline": "núi Ba Vì và đền Thượng linh thiêng",
        "aliases": ["Ba Vi"],
        "landmarks": [
            "Nhà thờ Pháp cổ",
            "Đền Thượng",
            "Làng cổ Đường Lâm",
        ],
        "nature_spots": [
            "Vườn quốc gia Ba Vì",
            "đồi thông 379",
            "vườn xương rồng",
        ],
        "cultural_experiences": [
            "lễ hội Tản Viên",
            "trải nghiệm nông trại bò sữa",
            "làng cổ Đường Lâm",
        ],
        "culinary": [
            "gà đồi",
            "bê non nướng",
            "sữa tươi Ba Vì",
        ],
        "souvenirs": ["sữa tươi", "sữa chua"],
    },
    "Cát Bà": {
        "region": "Hải Phòng",
        "nickname": "viên ngọc vịnh Bắc Bộ",
        "tagline": "vịnh Lan Hạ và rừng quốc gia",
        "aliases": ["Cat Ba"],
        "landmarks": [
            "Pháo đài Thần Công",
            "làng Việt Hải",
            "hang Quân Y",
        ],
        "nature_spots": [
            "Vịnh Lan Hạ",
            "Bãi Cát Cò",
            "Rừng quốc gia Cát Bà",
        ],
        "cultural_experiences": [
            "làng chài Cái Bèo",
            "lễ hội Cát Bà",
            "đánh bắt mực đêm",
        ],
        "culinary": [
            "tu hài",
            "sam biển",
            "cá song hấp",
        ],
        "souvenirs": ["mực khô", "ngọc trai"],
    },
    "Lý Sơn": {
        "region": "Quảng Ngãi",
        "nickname": "vương quốc tỏi",
        "tagline": "miệng núi lửa triệu năm",
        "aliases": ["Ly Son"],
        "landmarks": [
            "Cổng Tò Vò",
            "Chùa Hang",
            "Đỉnh Thới Lới",
        ],
        "nature_spots": [
            "Đảo Bé",
            "Bãi Sau",
            "ruộng tỏi Lý Sơn",
        ],
        "cultural_experiences": [
            "lễ khao lề thế lính Hoàng Sa",
            "làng nghề tỏi",
            "chợ đêm Lý Sơn",
        ],
        "culinary": [
            "gỏi tỏi non",
            "hải sâm",
            "cua Huỳnh Đế",
        ],
        "souvenirs": ["tỏi Lý Sơn", "hải sản khô"],
    },
    "Tuy Hòa": {
        "region": "Phú Yên",
        "nickname": "thành phố biển yên bình",
        "tagline": "tháp Nhạn và núi Chóp Chài",
        "aliases": ["Tuy Hoa"],
        "landmarks": [
            "Tháp Nhạn",
            "Biển Tuy Hòa",
            "Núi Chóp Chài",
        ],
        "nature_spots": [
            "Hòn Yến",
            "Đầm Ô Loan",
            "Bãi Long Thủy",
        ],
        "cultural_experiences": [
            "làng đúc đồng Phú Thứ",
            "nhạc cụ bài chòi",
            "Ẩm thực mắt cá ngừ",
        ],
        "culinary": [
            "sò huyết Ô Loan",
            "bánh hỏi lòng heo",
            "chè đậu xanh đánh",
        ],
        "souvenirs": ["bánh tráng Hòa Đa", "cá ngừ đóng hộp"],
    },
    "Vũng Tàu": {
        "region": "Bà Rịa - Vũng Tàu",
        "nickname": "thành phố biển năng động",
        "tagline": "tượng Chúa Kitô và hải đăng",
        "aliases": ["Vung Tau"],
        "landmarks": [
            "Tượng Chúa Kitô",
            "Hải đăng Vũng Tàu",
            "Mũi Nghinh Phong",
        ],
        "nature_spots": [
            "Bãi Sau",
            "Bãi Trước",
            "Khu du lịch Hồ Mây",
        ],
        "cultural_experiences": [
            "chợ Xóm Lưới",
            "đình Thắng Tam",
            "lễ hội Nghinh Ông",
        ],
        "culinary": [
            "bánh khọt",
            "lẩu cá đuối",
            "hàu nướng phô mai",
        ],
        "souvenirs": ["mứt hạt bàng", "hải sản khô"],
    },
    "Tây Ninh": {
        "region": "Đông Nam Bộ",
        "nickname": "miền đất tâm linh",
        "tagline": "Tòa thánh Cao Đài và núi Bà Đen",
        "aliases": ["Tay Ninh"],
        "landmarks": [
            "Núi Bà Đen",
            "Tòa thánh Cao Đài",
            "Hồ Dầu Tiếng",
        ],
        "nature_spots": [
            "Vườn quốc gia Lò Gò - Xa Mát",
            "cánh đồng mía",
            "suối Vàng",
        ],
        "cultural_experiences": [
            "lễ hội Quan Thánh",
            "chợ Long Hoa",
            "làng nghề bánh tráng phơi sương",
        ],
        "culinary": [
            "bánh canh Trảng Bàng",
            "mãng cầu Bà Đen",
            "muối tôm",
        ],
        "souvenirs": ["muối tôm", "bánh tráng phơi sương"],
    },
    "An Giang": {
        "region": "An Giang",
        "nickname": "miền Thất Sơn",
        "tagline": "chùa Bà Chúa Xứ và rừng tràm Trà Sư",
        "aliases": ["An Giang", "Chau Doc"],
        "landmarks": [
            "Miếu Bà Chúa Xứ",
            "Núi Sam",
            "Chợ Châu Đốc",
        ],
        "nature_spots": [
            "Rừng tràm Trà Sư",
            "Hồ Tà Pạ",
            "Núi Cấm",
        ],
        "cultural_experiences": [
            "lễ hội Vía Bà",
            "làng Chăm Châu Phong",
            "làng bè nổi trên sông Hậu",
        ],
        "culinary": [
            "mắm Châu Đốc",
            "bún cá",
            "thốt nốt tươi",
        ],
        "souvenirs": ["đường thốt nốt", "khô bò"],
    },
}


DEFAULT_PROFILE: LocationProfile = {
    "name": "Việt Nam",
    "region": "Miền đất di sản",
    "nickname": "điểm đến đa sắc màu",
    "tagline": "cảnh quan thiên nhiên và văn hóa bản địa",
    "landmarks": [
        "các điểm tham quan nổi bật",
        "làng nghề truyền thống",
        "chợ địa phương",
    ],
    "nature_spots": [
        "cánh đồng xanh mướt",
        "sông suối yên bình",
        "đồi núi thơ mộng",
    ],
    "cultural_experiences": [
        "giao lưu văn hóa",
        "thưởng thức nghệ thuật dân gian",
        "chợ đêm đặc sắc",
    ],
    "culinary": [
        "đặc sản vùng miền",
        "ẩm thực đường phố",
        "tráng miệng truyền thống",
    ],
    "souvenirs": ["đặc sản địa phương", "thủ công mỹ nghệ"],
    "aliases": [],
}


CATEGORY_FALLBACKS: Dict[str, LocationProfile] = {
    "adventure": {
        "name": "Hành trình phiêu lưu",
        "region": "Miền núi",
        "nickname": "cung đường chinh phục",
        "tagline": "leo núi, trekking và trải nghiệm bản địa",
        "landmarks": ["đỉnh núi hùng vĩ", "thác nước nguyên sơ", "bản làng vùng cao"],
        "nature_spots": ["đèo cao", "thung lũng", "ruộng bậc thang"],
        "cultural_experiences": ["chợ phiên", "giao lưu văn nghệ", "học nghề thủ công"],
        "culinary": ["lẩu cá suối", "gà nướng", "rượu ngâm thảo mộc"],
        "souvenirs": ["thổ cẩm", "mật ong rừng"],
    },
    "nature": {
        "name": "Thiên nhiên xanh",
        "region": "Sinh thái",
        "nickname": "kho báu thiên nhiên",
        "tagline": "rừng, biển và sinh vật hoang dã",
        "landmarks": ["khu dự trữ sinh quyển", "bãi biển xanh", "núi rừng bất tận"],
        "nature_spots": ["rừng nguyên sinh", "đầm phá", "hang động"],
        "cultural_experiences": ["làng chài", "chợ hải sản", "lễ hội mùa biển"],
        "culinary": ["hải sản nướng", "gỏi cá", "nước mắm đặc sản"],
        "souvenirs": ["ngọc trai", "đặc sản biển"],
    },
    "cultural": {
        "name": "Di sản văn hóa",
        "region": "Làng nghề",
        "nickname": "hồn phố cổ",
        "tagline": "di tích, lễ hội và nghệ nhân",
        "landmarks": ["phố cổ", "đình chùa", "bảo tàng"],
        "nature_spots": ["sông thơ mộng", "bãi bồi", "làng quê"],
        "cultural_experiences": ["lễ hội truyền thống", "làm đèn lồng", "dệt lụa"],
        "culinary": ["cao lầu", "bánh bèo", "chè sen"],
        "souvenirs": ["lụa tơ tằm", "đèn lồng"],
    },
    "food": {
        "name": "Hành trình ẩm thực",
        "region": "Ẩm thực",
        "nickname": "thiên đường vị giác",
        "tagline": "món ngon đường phố",
        "landmarks": ["chợ đầu mối", "phố ẩm thực", "quán lâu năm"],
        "nature_spots": ["khu phố cổ", "ven hồ lộng gió", "chợ hải sản"],
        "cultural_experiences": ["lớp học nấu ăn", "tour cà phê", "chợ đêm"],
        "culinary": ["phở", "bánh xèo", "chè cổ truyền"],
        "souvenirs": ["đặc sản đóng gói", "gia vị"],
    },
    "urban": {
        "name": "Thành phố trẻ",
        "region": "Đô thị",
        "nickname": "nhịp sống hiện đại",
        "tagline": "ẩm thực đêm và kiến trúc mới",
        "landmarks": ["phố đi bộ", "tòa nhà biểu tượng", "bảo tàng nghệ thuật"],
        "nature_spots": ["công viên bờ sông", "sky bar", "bến du thuyền"],
        "cultural_experiences": ["chợ đêm", "show diễn ánh sáng", "bar rooftop"],
        "culinary": ["ẩm thực fusion", "cà phê specialty", "tráng miệng hiện đại"],
        "souvenirs": ["đồ thiết kế", "sản phẩm sáng tạo"],
    },
    "spiritual": {
        "name": "Hành hương tâm linh",
        "region": "Miền thiêng",
        "nickname": "miền an lạc",
        "tagline": "chùa chiền và lễ hội tín ngưỡng",
        "landmarks": ["quần thể tâm linh", "núi thiêng", "thánh thất"],
        "nature_spots": ["đồi thông", "suối nước nóng", "thung lũng bình yên"],
        "cultural_experiences": ["lễ đàn cầu an", "nghe nhã nhạc", "làm bánh cúng"],
        "culinary": ["cơm chay", "bánh ít", "chè sen"],
        "souvenirs": ["trầm hương", "tượng gỗ"],
    },
}


def _normalize(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFD", value)
    ascii_chars = "".join(
        ch
        for ch in normalized
        if unicodedata.category(ch) != "Mn"
    )
    cleaned = []
    for ch in ascii_chars.lower():
        if ch.isalnum() or ch.isspace():
            cleaned.append(ch)
        elif ch in {".", ",", "-"}:
            cleaned.append(" ")
    return " ".join("".join(cleaned).split())


def _clone_profile(name: str, data: LocationProfile) -> LocationProfile:
    base = {
        "name": name,
        "region": data.get("region", DEFAULT_PROFILE["region"]),
        "nickname": data.get("nickname", DEFAULT_PROFILE["nickname"]),
        "tagline": data.get("tagline", DEFAULT_PROFILE["tagline"]),
        "aliases": list(data.get("aliases", [])),
    }
    for field in [
        "landmarks",
        "nature_spots",
        "cultural_experiences",
        "culinary",
        "souvenirs",
    ]:
        base[field] = list(data.get(field, DEFAULT_PROFILE[field]))
    return base


_ALIAS_INDEX = {
    _normalize(alias if alias else name): name
    for name, profile in LOCATION_PROFILES.items()
    for alias in [name, *profile.get("aliases", [])]
    if _normalize(alias if alias else name)
}


def get_location_profile(location_name: str | None, category: str | None = None) -> LocationProfile:
    normalized = _normalize(location_name)
    for slug, name in _ALIAS_INDEX.items():
        if not slug:
            continue
        if slug in normalized or normalized in slug:
            return _clone_profile(name, LOCATION_PROFILES[name])
    if category and category in CATEGORY_FALLBACKS:
        fallback = CATEGORY_FALLBACKS[category]
        return _clone_profile(fallback.get("name", DEFAULT_PROFILE["name"]), fallback)
    return _clone_profile(DEFAULT_PROFILE["name"], DEFAULT_PROFILE)


def _pick(values: List[str], index: int) -> str:
    if not values:
        return ""
    return values[index % len(values)]


def build_itinerary(profile: LocationProfile, duration_days: int, starting_point: str) -> List[Dict[str, Any]]:
    duration = max(1, duration_days)
    phases = [
        "Khởi hành & cảm nhận nhịp sống đầu tiên",
        "Chạm vào biểu tượng thiên nhiên",
        "Trải nghiệm văn hóa bản địa",
        "Nghỉ dưỡng & ẩm thực",
        "Tạm biệt và mua sắm đặc sản",
    ]
    itinerary: List[Dict[str, Any]] = []
    for day in range(1, duration + 1):
        phase_title = phases[min(day - 1, len(phases) - 1)]
        landmark = _pick(profile["landmarks"], day - 1)
        nature = _pick(profile["nature_spots"], day - 1)
        culture = _pick(profile["cultural_experiences"], day - 1)
        cuisine = _pick(profile["culinary"], day - 1)
        souvenir = _pick(profile["souvenirs"], day - 1)
        description = (
            f"Buổi sáng đón khách tại {starting_point}, khởi hành khám phá {profile['nickname']} với điểm nhấn {landmark}. "
            f"Buổi chiều dành thời gian thư giãn bên {nature} và tham gia hoạt động {culture}, kết thúc bằng bữa tối với món {cuisine}."
        )
        activities = [
            f"Đón khách tại {starting_point} và phổ biến thông tin an toàn hành trình.",
            f"Tham quan {landmark} cùng hướng dẫn viên bản địa, nghe kể những câu chuyện đặc sắc.",
            f"Di chuyển đến {nature} để săn ảnh, tận hưởng không khí trong lành và các hoạt động thư giãn.",
            f"Trải nghiệm {culture}, hòa mình vào đời sống người dân địa phương.",
            f"Thưởng thức món {cuisine} do đầu bếp địa phương chuẩn bị, cảm nhận đủ vị chua - cay - mặn - ngọt.",
            f"Tự do dạo phố, mua sắm quà tặng như {souvenir} và chụp ảnh đêm lung linh.",
        ]
        if duration == 1:
            accommodation = "Không lưu trú (tour trong ngày)"
            meals = (
                f"Sáng: Đón khách | Trưa: {cuisine.capitalize()} | Tối: Tự do khám phá ẩm thực {profile['name']}"
            )
        else:
            if day == duration:
                accommodation = "Không lưu trú (trả phòng trước 12:00, khởi hành về điểm hẹn)"
            else:
                accommodation = f"Khách sạn 3-4 sao trung tâm {profile['name']} (2-3 khách/phòng)"
            dinner_note = "Tiệc BBQ" if day == 2 and duration >= 3 else "Set menu đặc sản"
            meals = (
                f"Sáng: Buffet khách sạn | Trưa: {cuisine.capitalize()} | Tối: {dinner_note} với hương vị địa phương"
            )
        itinerary.append(
            {
                "day": day,
                "title": f"Ngày {day:02d}: {phase_title}",
                "description": description,
                "activities": activities,
                "accommodation": accommodation,
                "meals": meals,
            }
        )
    return itinerary


def generate_description(profile: LocationProfile, duration_days: int) -> str:
    landmark_summary = ", ".join(profile["landmarks"][:2])
    culture_spot = _pick(profile["cultural_experiences"], 0)
    cuisine = _pick(profile["culinary"], 0)
    text = f"""
    Hành trình {duration_days} ngày đưa bạn đến {profile['name']} - {profile['nickname']} với {profile['tagline']}.
    Đoàn sẽ ghé thăm các biểu tượng như {landmark_summary}, len lỏi qua {profile['nature_spots'][0]}
    và gặp gỡ cộng đồng địa phương tại {culture_spot}. Mỗi bữa ăn đều được chăm chút với
    các đặc sản {cuisine}, giúp bạn cảm nhận trọn vẹn hương vị bản địa.
    """
    return dedent(text).strip()


def generate_inclusions(profile: LocationProfile) -> List[str]:
    return [
        f"Xe du lịch đời mới đưa đón và tham quan xuyên suốt tại {profile['name']}.",
        f"Khách sạn 3-4 sao trung tâm {profile['name']} (2-3 khách/phòng, có thể kê giường phụ).",
        "Bữa sáng, trưa, tối theo chương trình với thực đơn đặc sản địa phương mỗi ngày.",
        "Vé tham quan, phí danh thắng, vé cáp treo/tàu cao tốc (nếu có) theo lịch trình.",
        "Hướng dẫn viên tiếng Việt giàu kinh nghiệm, hỗ trợ suốt tuyến và chăm sóc đoàn.",
        "Bảo hiểm du lịch nội địa với mức bồi thường tối đa 150.000.000 VNĐ/khách/vụ.",
        "Quà tặng: nón du lịch, nước suối, khăn lạnh và dược phẩm cơ bản trên xe.",
    ]


def generate_exclusions(profile: LocationProfile) -> List[str]:
    return [
        "Vé máy bay/tàu di chuyển đến điểm tập trung (trừ khi được ghi rõ trong chương trình).",
        "Chi phí phòng đơn, nâng hạng khách sạn, minibar và dịch vụ giặt ủi.",
        "Đồ uống có cồn, cafe đặc biệt, chi tiêu cá nhân và các bữa ăn ngoài chương trình.",
        "Vé tham quan tự chọn như show giải trí, công viên chủ đề hoặc tour trải nghiệm riêng.",
        "Phụ thu lễ, Tết, cuối tuần cao điểm và chi phí phát sinh do thay đổi lịch trình cá nhân.",
        "Tips cho hướng dẫn viên, tài xế (khuyến khích 50.000 - 100.000 VNĐ/người/ngày).",
    ]


def generate_policy(profile: LocationProfile) -> str:
    policy = f"""
    Giá tour bao gồm
    - Xe du lịch đời mới, máy lạnh, phục vụ theo lộ trình.
    - Khách sạn tiêu chuẩn 3-4 sao tại {profile['name']}, 2-3 khách/phòng (có thể kê giường phụ).
    - Bữa ăn theo chương trình với thực đơn địa phương thay đổi từng ngày.
    - Vé tham quan, vé tàu/cáp treo (nếu có) và phí hướng dẫn viên.
    - Bảo hiểm du lịch nội địa tối đa 150.000.000 VNĐ/khách/vụ.

    Giá tour không bao gồm
    - Chi phí cá nhân: điện thoại, giặt ủi, minibar, đồ uống ngoài set menu.
    - Vé máy bay/ tàu hỏa khứ hồi đến điểm tập trung (trừ khi ghi rõ).
    - Các chương trình tự chọn như show nghệ thuật, spa, bar/club.
    - Phụ thu phòng đơn, phụ thu lễ Tết, phụ thu nâng hạng dịch vụ.

    Giá trẻ em
    - Trẻ dưới 6 tuổi: miễn phí vé tour, ngủ chung với gia đình (tối đa 1 bé/2 người lớn).
    - Trẻ 6-11 tuổi: tính 50% giá tour người lớn, bao gồm suất ăn và ghế ngồi riêng.
    - Trẻ từ 12 tuổi: áp dụng giá như người lớn và bố trí giường riêng.

    Chính sách hủy/ phạt
    - Hủy trước 15 ngày: phạt 10% giá tour.
    - Hủy trước 8-14 ngày: phạt 30% giá tour.
    - Hủy trước 4-7 ngày: phạt 50% giá tour.
    - Hủy trước 48 giờ hoặc không tham gia: phạt 90-100% giá tour.
    - Dịp Lễ/Tết: áp dụng phụ lục riêng, vui lòng liên hệ để được tư vấn chi tiết.

    Bảo hiểm du lịch
    - Tặng miễn phí bảo hiểm du lịch nội địa cho toàn bộ hành trình.
    - Mức đền bù tối đa 150.000.000 VNĐ/khách/vụ đối với thiệt hại về người.
    - Hỗ trợ y tế 24/7 và hướng dẫn thủ tục bồi thường nhanh chóng.

    Giấy tờ tùy thân và lưu ý
    - Khách Việt Nam mang CCCD/CMND gốc; trẻ em dưới 14 tuổi mang giấy khai sinh.
    - Khách quốc tế/Việt kiều mang hộ chiếu còn hạn cùng visa (nếu có).
    - Chuẩn bị hành lý gọn nhẹ, tự bảo quản tài sản cá nhân và tuân thủ giờ giấc đoàn.
    """
    return dedent(policy).strip()


def build_tour_content(
    location_name: str | None,
    duration_days: int,
    category: str | None = None,
    starting_point: str | None = None,
) -> Dict[str, Any]:
    profile = get_location_profile(location_name, category)
    duration = max(1, duration_days)
    start = starting_point or location_name or profile["name"]
    return {
        "description": generate_description(profile, duration),
        "itinerary": build_itinerary(profile, duration, start),
        "inclusions": generate_inclusions(profile),
        "exclusions": generate_exclusions(profile),
        "policy": generate_policy(profile),
    }


__all__ = [
    "build_tour_content",
    "get_location_profile",
    "generate_description",
    "build_itinerary",
]
