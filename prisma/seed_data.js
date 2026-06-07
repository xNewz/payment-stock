import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const usersData = [
  { name: "นางสาว อมรรัตน์ กองพร", phone: "0818118029" },
  { name: "นางสาว มินตรา มีพวง", phone: "0959542806" },
  { name: "นางสาว ทัศนีย์ หวังชอบ", phone: "0930237873" },
  { name: "นางสาว เจียระไน ใจมั่น", phone: "0644326649" },
  { name: "นาย ธนทน ชูม่วง", phone: "0612075747" },
  { name: "นาย อรรถพงษ์ กัลยานุกูล", phone: "0957103295" },
  { name: "นางสาว อุทัยวรรณ แสนบัวคำ", phone: "0661417898" },
  { name: "นางสาว บุจรินทร์ ก่ำบุญ", phone: "0925397778" },
  { name: "นาย นันทิพัฒน์ ลาพูล", phone: "0918655343" },
  { name: "นางสาว อิงอร เดชชู", phone: "064100236" },
  { name: "นาย ชัยพฤกษ์ นาควิเศษ", phone: "0858230363" },
  { name: "นางสาว เจตสุภา เทศเทียน", phone: "0953236821" },
  { name: "นางสาว ประทุมพร ธเนศวรอาภณร์", phone: "0610162490" },
  { name: "นาย แจนวิทย์ ชัยจินตวัฒน์", phone: "0886803384" },
  { name: "นางตินศิรินทร์ ศรีทรงผล", phone: "0924641990" },
  { name: "นาย ไพบูลย์ ศรีทรงผล", phone: "0863410633" },
  { name: "นาย บุญบพิตร์ ธุระสาร", phone: "0973103646" },
  { name: "นางสาว ทัศนีย์ บุญเฟรือง", phone: "0996720214" },
  { name: "นางสาว นีรนุช แจ่มใส", phone: "0973376584" },
  { name: "นางสาว พัชรา เชียงสาพันธ์", phone: "0990860950" },
  { name: "นาย ชัยวัฒน์ รอบคอบ", phone: "0636311837" },
  { name: "นาย ชลธาร เอี่นมผ่อง", phone: "0631801136" },
  { name: "นาย ต้องพงค์ ชูแสง", phone: "0840818852" },
  { name: "นางสาว มาริษา แหวนทองคำ", phone: "0936392247" },
  { name: "นาย จารุพัฒน์ แสงสุวรรณ", phone: "0622061401" },
  { name: "นางสาว อรพรรณ ขันทอง", phone: "0929398434" },
  { name: "นาย ชุคติ เดชชู", phone: "0908982819" },
  { name: "นางสาว ลลนา หทัยเดชะดุษฎี", phone: "0983868147" },
  { name: "นางสาว เสฎฐิปภา จิตสุภาพ", phone: "0886421875" }
];

async function main() {
  console.log('กำลังเริ่มเพิ่มข้อมูลผู้ใช้งาน...');

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { phone: user.phone },
      update: {}, 
      create: {
        name: user.name,
        phone: user.phone,
        username: user.phone, // ใช้เบอร์โทรเป็น username
        password: user.phone, // เปลี่ยนมาใช้เบอร์โทรเป็น password ตามที่แจ้งแล้วครับ
        role: "USER"
      },
    });
  }

  console.log(`เพิ่มข้อมูลสำเร็จทั้งหมด ${usersData.length} รายการ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
