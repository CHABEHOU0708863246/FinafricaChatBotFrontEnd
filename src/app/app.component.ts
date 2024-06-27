import { HttpClientModule } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InsurancePack } from './core/models/InsurancePack';
import { VehicleInfo } from './core/models/VehicleInfo';
import { FleetQuoteService, RiskCategory } from './core/services/fleet-quote.service';
import { format, Locale } from 'date-fns';
import { VehicleInfoRequest } from './core/models/VehicleInfoRequest';
import * as XLSX from 'xlsx';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  host: {
    '[attr.ngSkipHydration]': 'true',
  },
  styleUrls: ['./app.component.scss'],
  providers: [
    FleetQuoteService
  ],
})
export class AppComponent implements OnInit, AfterViewChecked {

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatbotContainer') chatbotContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleChatbotButton') toggleChatbotButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private isChatbotCollapsed = false;

  collapsed: boolean = false;


  vehicleInfo: VehicleInfo = {
    category: '',
    usage: '',
    genre: '',
    fiscalPower: 0,
    energyType: '',
    seatNumber: 0,
    newValue: 0,
    marketValue: 0,
    hasTrailer: false,
    firstRegistrationDate: new Date(),
    contractDuration: 0
  };

  insurancePacks: InsurancePack[] = [];
  totalPremium: number = 0;

  chatMessages: { sender: 'bot' | 'user', message: string }[] = [];

  currentStep: number = 0;

  currentQuestionIndex: number = 0;

  vehicleQuestions: string[] = [
    '1. Catégorie du véhicule (Exemple : catégorie 1) :',
    '2. Usage du véhicule (Exemple : privé, professionnel, auto-école, location, etc.) :',
    '3. Genre du véhicule (Exemple : tourisme, utilitaire a corrosserie, etc.) :',
    '4. Puissance fiscale du véhicule (Exemple : 25, en CV) :',
    '5. Type d\'énergie du véhicule (Exemple : essence, diesel, electrique, hybride) :',
    '6. Nombre de places dans le véhicule (Exemple : 10) :',
    '7. Valeur à neuf du véhicule (prix auquel le vehicule a été acheté en FCFA) :',
    '8. Valeur de marché du véhicule (prix auquel le vehicule pourrait être vendu sur le marché en FCFA) :',
    '9. Indiquez si le véhicule possède une remorque (oui/non) :',
    '10. Date de première immatriculation du véhicule (JJ/MM/AAAA, Exemple : 12/01/0000) :',
    '11. Durée du contrat d\'assurance souhaitée (en mois, Exemple : vous pouvez saisir soit 3, 6 ou 12 uniquement) :'
  ];


  initialOptions: string[] = [
    '1. Obtenir une simulation de tarification pour un véhicule particulier',
    '2. Obtenir une simulation de tarification pour une flotte de véhicules',
    '3. Comparer les offres d\'assurance',
    '4. Gérer mon contrat d\'assurance',
    '5. Parler à un conseiller',
    '6. En savoir plus sur OAV Finafrica'
  ];




  constructor(private fleetQuoteService: FleetQuoteService, private el: ElementRef, private renderer: Renderer2, private elementRef: ElementRef) { }


  ngOnInit() {
      this.sendBotMessage('Bonjour ! Je suis Leila, votre assistant pour la tarification d\'assurance automobile. Comment puis-je vous aider aujourd\'hui ?');
      setTimeout(() => {
        const chatbotContainer = this.elementRef.nativeElement.querySelector('.chatbot-container');
        chatbotContainer.classList.remove('hidden');
      }, 7000);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // scrollToBottom(): void {
  //   if (this.messagesContainer && this.messagesContainer.nativeElement) {
  //     this.messagesContainer.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
  //   }
  // }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.el.nativeElement.querySelector('.messages-content');
      this.renderer.setProperty(element, 'scrollTop', element.scrollHeight);
    }
  }


  toggleChatbot(): void {
    this.isChatbotCollapsed = !this.isChatbotCollapsed;
    // Ajouter la logique pour réduire ou agrandir le chatbot
    if (this.isChatbotCollapsed) {
      this.chatbotContainer.nativeElement.classList.add('collapsed');
    } else {
      this.chatbotContainer.nativeElement.classList.remove('collapsed');
    }
  }


  onMouseDown(event: MouseEvent): void {
    const chatbot = this.chatbotContainer.nativeElement;
    const initialX = event.clientX - chatbot.getBoundingClientRect().left;
    const initialY = event.clientY - chatbot.getBoundingClientRect().top;

    const onMouseMove = (moveEvent: MouseEvent) => {
      chatbot.style.left = moveEvent.clientX - initialX + 'px';
      chatbot.style.top = moveEvent.clientY - initialY + 'px';
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  resetPage() {
    window.location.reload();
  }


  sendUserMessage(message: string) {
    const cleanedMessage = message.replace(/\n/g, '');
    this.chatMessages.push({ sender: 'user', message: cleanedMessage });
    this.processUserMessage(cleanedMessage);
    this.scrollToBottom();
  }


  sendBotMessage(message: string) {
    this.chatMessages.push({ sender: 'bot', message });
    this.scrollToBottom();
  }

  async processUserMessage(message: string) {
    if (this.currentStep === 1) {
      this.collectVehicleInfoStep(message);
    } else {
      switch (message) {
        case '1. Obtenir une simulation de tarification pour un véhicule particulier':
          this.currentStep = 1;
          this.sendBotMessage('Parfait ! Commençons la simulation. Veuillez fournir les informations suivantes :');
          this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
          break;
        case '2. Obtenir une simulation de tarification pour une flotte de véhicules':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '3. Comparer les offres d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '4. Gérer mon contrat d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '5. Parler à un conseiller':
          this.contactAdvisor();
          break;
        case '6. En savoir plus sur OAV Finafrica':
            this.provideInfoAboutOAVFinafrica();
            break;
            default:
              this.handleGeneralInquiry(message);
              break;
      }
    }
  }


  provideInfoAboutOAVFinafrica() {
    const info = `OAV Finafrica est un outil digital d'aide à la vente de produits d'assurances développé par Finafrica, une filiale du Groupe Duval spécialisée dans l'inclusion financière et assurantielle en Afrique.

  Principales fonctionnalités :
  - Tarification et devis rapides
  - Gestion des dossiers clients
  - Support commercial
  - Formation en ligne

  Avantages :
  - Gain de temps et d'efficacité pour les agents d'assurance
  - Amélioration de la qualité du conseil
  - Augmentation des ventes de produits d'assurance

  Que souhaitez-vous savoir de plus sur OAV Finafrica ?`;

    this.sendBotMessage(info);
  }

  handleGeneralInquiry(message: string) {
    // Vous pouvez implémenter ici une logique plus avancée pour analyser la question
    // et fournir une réponse appropriée. Pour l'instant, nous allons simplement
    // renvoyer à l'utilisateur vers les options principales.

    this.sendBotMessage("Je n'ai pas bien compris votre demande. Pouvez-vous reformuler ou choisir parmi les options suivantes :");
    // this.resetOptions();
  }



  askNextVehicleQuestion() {
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(`Réflexion en cours...`);
      setTimeout(() => {
        this.sendBotMessage(`Veuillez fournir les informations suivantes pour votre véhicule : ${this.vehicleQuestions[this.currentQuestionIndex]}`);
      }, 1500);
    } else {
      this.currentStep = 0;
      this.simulateTarification();
    }
  }


  cleanInput(input: string): string {
    return input.replace(/\n/g, '');
  }

  async collectVehicleInfoStep(message: string) {
    switch (this.currentQuestionIndex) {
      case 0:
        this.vehicleInfo.category = this.cleanInput(message);
        if (!['categorie 1', 'categorie 2', 'categorie 3', 'categorie 4', 'categorie 5'].includes(this.vehicleInfo.category.toLowerCase())) {
          this.sendBotMessage('Catégorie du véhicule invalide. Veuillez choisir entre categorie 1, categorie 2, categorie 3, categorie 4 ou categorie 5');
          return;
        }
        break;
      case 1:
        this.vehicleInfo.usage = this.cleanInput(message);
        if (!['personnel', 'professionnel', 'mixte', 'privé', 'professionnel', 'auto-école', 'location',].includes(this.vehicleInfo.usage.toLowerCase())) {
          this.sendBotMessage('Usage du véhicule invalide. Veuillez choisir entre personnel, professionnel ou mixte.');
          return;
        }
        break;
      case 2:
        this.vehicleInfo.genre = this.cleanInput(message);
        if (this.vehicleInfo.genre.length < 2) {
          this.sendBotMessage('Genre du véhicule invalide. Veuillez fournir plus de détails.');
          return;
        }
        break;
      case 3:
        this.vehicleInfo.fiscalPower = parseInt(message, 10);
        if (isNaN(this.vehicleInfo.fiscalPower) || this.vehicleInfo.fiscalPower <= 0 || this.vehicleInfo.fiscalPower > 100) {
          this.sendBotMessage('Puissance fiscale invalide. Veuillez entrer un nombre entre 1 et 200.');
          return;
        }
        break;
      case 4:
        this.vehicleInfo.energyType = this.cleanInput(message);
        if (!['essence', 'diesel', 'électrique', 'hybride'].includes(this.vehicleInfo.energyType.toLowerCase())) {
          this.sendBotMessage('Type d\'énergie invalide. Veuillez choisir entre essence, diesel, électrique ou hybride.');
          return;
        }
        break;
      case 5:
        this.vehicleInfo.seatNumber = parseInt(message, 10);
        if (isNaN(this.vehicleInfo.seatNumber) || this.vehicleInfo.seatNumber <= 0 || this.vehicleInfo.seatNumber > 50) {
          this.sendBotMessage('Nombre de sièges invalide. Veuillez entrer un nombre entre 1 et 50.');
          return;
        }
        break;
      case 6:
        this.vehicleInfo.newValue = parseFloat(message);
        if (isNaN(this.vehicleInfo.newValue) || this.vehicleInfo.newValue <= 0) {
          this.sendBotMessage('Valeur à neuf invalide. Veuillez entrer un nombre positif.');
          return;
        }
        break;
      case 7:
        this.vehicleInfo.marketValue = parseFloat(message);
        if (isNaN(this.vehicleInfo.marketValue) || this.vehicleInfo.marketValue <= 0 || this.vehicleInfo.marketValue > this.vehicleInfo.newValue) {
          this.sendBotMessage('Valeur marchande invalide. Elle doit être un nombre positif et ne pas dépasser la valeur achat à neuf du vehicule.');
          return;
        }
        break;
      case 8:
        const lowercaseMessage = message.toLowerCase();
        if (!['oui', 'non'].includes(lowercaseMessage)) {
          this.sendBotMessage('Réponse invalide pour la remorque. Veuillez répondre par oui ou non.');
          return;
        }
        this.vehicleInfo.hasTrailer = ['oui', 'true'].includes(lowercaseMessage);
        break;
      case 9:
        const dateParts = message.split('/');
        if (dateParts.length !== 3 || dateParts.some(part => isNaN(parseInt(part, 10)))) {
          this.sendBotMessage('Format de date invalide. Veuillez utiliser le format JJ/MM/AAAA.');
          return;
        }
        const date = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10));
        if (isNaN(date.getTime()) || date > new Date()) {
          this.sendBotMessage('Date de première immatriculation invalide. La date ne peut pas être dans le futur.');
          return;
        }
        this.vehicleInfo.firstRegistrationDate = date.toISOString();
        break;
      case 10:
        this.vehicleInfo.contractDuration = parseInt(message, 10);
        if (isNaN(this.vehicleInfo.contractDuration) || ![3, 6, 12].includes(this.vehicleInfo.contractDuration)) {
          this.sendBotMessage('Durée de contrat invalide. Veuillez saisir soit 3, 6 ou 12 mois.');
          return;
        }
        await this.calculatePremium();
        return;
    }
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
    }
  }

  async calculatePremium() {
    try {
      const premium = await this.fleetQuoteService.calculateInsurancePremium(this.vehicleInfo).toPromise();
      if (premium !== undefined) {
        this.totalPremium = premium;
        const formattedPremium = premium.toLocaleString('fr-FR');
        this.sendBotMessage(`Le montant total de votre prime d'assurance est de ${formattedPremium} FCFA.`);
        await this.fetchInsurancePacks();
      } else {
        this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Prime non définie.');
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la prime d\'assurance :', error);
      this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Veuillez vérifier les informations fournies et réessayer.');
    }
  }


  async fetchInsurancePacks() {
    const totalBonusPoints = 100; // Exemple de valeur
    const riskCategory = RiskCategory.LowRisk; // Exemple de catégorie de risque

    this.fleetQuoteService.getInsurancePacks(totalBonusPoints, riskCategory)
      .subscribe(
        (packs) => {
          if (packs) {
            this.insurancePacks = packs; // Assignation après vérification de nullité
          } else {
            console.error('Erreur : la réponse des packs d\'assurance est nulle.');
          }
        },
        (error) => {
          console.error('Erreur lors de la récupération des packs d\'assurance : ', error);
        }
      );
  }

  collectFleetInfo(event: any) {
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const workbook: XLSX.WorkBook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName: string = workbook.SheetNames[0];
      const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];

      const fleetData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log(fleetData);


      this.sendBotMessage(`Données de flotte importées avec succès depuis le fichier Excel.`);
      this.currentStep = 0;
    };

    reader.readAsBinaryString(file);
  }

  contactAdvisor() {
    this.currentStep = 2;
    const advisorInfo = {
      name: 'Mme Leila de finafrica',
      email: 'support@finafrica.com'
    };

    this.sendBotMessage(`Une conseillère, ${advisorInfo.name}, sera avec vous sous peu.`);
    this.sendBotMessage(`Vous pouvez le contacter à l'adresse e-mail : ${advisorInfo.email}.`);

  }

  simulateTarification() {
    const vehicleInfoForRequest: VehicleInfo = {
      ...this.vehicleInfo,
      firstRegistrationDate: this.vehicleInfo.firstRegistrationDate.toString()
    };

    this.fleetQuoteService.calculateInsurancePremium(vehicleInfoForRequest)
      .subscribe(
        (premium) => {
          this.totalPremium = premium;
          this.sendBotMessage(`Le coût total de votre prime d'assurance est de ${premium} FCFA. Voulez-vous procéder au paiement ?`);
        },
        (error) => {
          console.error('Erreur lors de la simulation de tarification:', error);
          this.sendBotMessage('Une erreur est survenue lors de la simulation de tarification. Veuillez réessayer plus tard.');
        }
      );
}


  sendMessage() {
    const messageText = this.messageInput.nativeElement.value.trim();
    if (messageText) {
      this.sendUserMessage(messageText);
      this.messageInput.nativeElement.value = '';
    }
  }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Process the file here
      this.sendBotMessage(`Fichier sélectionné : ${file.name}`);
    }
  }


  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    // Logique pour uploader le fichier
    console.log('File uploaded:', file);
    this.chatMessages.push({ sender: 'user', message: `Fichier uploadé: ${file.name}` });
    this.fileInput.nativeElement.value = '';
  }





}
